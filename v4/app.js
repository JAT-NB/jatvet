import {initializeApp} from 'firebase/app';
import {validateConfig,hasAdminClaim} from './environment.js';
import {getAuth,getIdTokenResult,connectAuthEmulator,onAuthStateChanged,signInWithEmailAndPassword,signOut,sendPasswordResetEmail,browserSessionPersistence,setPersistence} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator,doc,setDoc} from 'firebase/firestore';
import {mergeBackup,validateBackup,totals,same} from './data.js';
import {repository} from './repository.js';
import {mountLegacy} from './legacy.js';
const $=id=>document.getElementById(id),status=text=>$('status').textContent=text;
let isAdmin=false;
let auth,db,user,repo,current,uid,revision=0,unsubscribe,generation=0,busy=false,failed=false,plan,pending;
function error(e){const messages={'auth/wrong-password':'Correo o contraseña incorrectos.','auth/user-not-found':'Correo o contraseña incorrectos.','auth/invalid-credential':'Correo o contraseña incorrectos.','auth/too-many-requests':'Demasiados intentos. Volvé a intentar más tarde.','auth/network-request-failed':'No se pudo conectar. Revisá tu conexión.','permission-denied':'No tenés permiso para acceder a este espacio.'};status(messages[e.code]||e.message||'Ocurrió un error.');}
function clear(){generation++;unsubscribe?.();unsubscribe=null;repo=null;current=null;pending=null;plan=null;busy=false;failed=false;$('editor').__disposeLegacy?.();$('editor').replaceChildren();$('editor').classList.remove('busy');$('editor').inert=false;$('review').textContent='';$('backup').value='';$('confirmOwner').checked=false;$('importBackup').disabled=true;$('download').hidden=true;}
function draw(){mountLegacy($('editor'),current,data=>void persist(data));}
async function persist(data){
 if(busy||failed||!repo||!user)return;
 const session=generation,activeRepo=repo,actor=user.uid;
 busy=true;$('editor').inert=true;$('editor').classList.add('busy');$('importBackup').disabled=true;pending=structuredClone(data);$('download').hidden=false;status('Guardando en Firebase…');
 try{data=validateBackup(data);const next=await activeRepo.save(data,revision,actor);if(session!==generation)return;revision=next;const stored=await activeRepo.read();if(session!==generation)return;if(stored.revision!==next||!same(stored.data,data))throw Error('No se pudo verificar la copia guardada: existe una revisión diferente.');current=structuredClone(stored.data);pending=null;$('download').hidden=true;plan=null;$('review').textContent='';status('Guardado en Firebase. Revisión '+revision+' · '+uid);}
 catch(e){if(session!==generation)return;failed=true;error(e);status($('status').textContent+' Conservamos la copia pendiente en memoria: descargala antes de salir.');}
 finally{if(session===generation){busy=false;if(!failed){$('editor').inert=false;$('editor').classList.remove('busy');}}}
}
async function open(target){
 if(busy||pending){status('Descargá y resolvé los cambios pendientes antes de cambiar de espacio.');return;}
 clear();const session=generation;uid=target;repo=repository(db,target);status('Abriendo espacio '+uid+'…');
 try{const result=await repo.read();if(session!==generation)return;current=result.data;revision=result.revision;draw();status('Espacio '+uid+' · revisión '+revision);unsubscribe=repo.watch(remote=>{if(session===generation && remote!==revision && !busy)status('Hay cambios de otro dispositivo. Recargá el espacio antes de editar; los cambios simultáneos serán rechazados.');},e=>{if(session===generation){failed=true;$('editor').inert=true;$('editor').classList.add('busy');error(e);}});}
 catch(e){if(session===generation)error(e);}
}
$('reloadWorkspace').onclick=()=>void open(uid);
$('loginForm').onsubmit=async e=>{e.preventDefault();try{await signInWithEmailAndPassword(auth,$('email').value.trim(),$('password').value);$('password').value='';}catch(e){error(e);}};
$('reset').onclick=async()=>{if(!$('email').checkValidity()||!$('email').value){status('Ingresá un correo válido para recuperar tu contraseña.');return;}try{await sendPasswordResetEmail(auth,$('email').value.trim());status('Si el correo corresponde a una cuenta, recibirá instrucciones de recuperación.');}catch(e){error(e);}};
$('logout').onclick=async()=>{if(busy||pending){status('Hay cambios pendientes. Descargá la copia antes de cerrar; recargá para descartarlos explícitamente.');return;}try{await signOut(auth);}catch(e){error(e);}};
$('openWorkspace').onclick=()=>{if(!isAdmin)return;const target=$('targetUid').value.trim();if(!target||target.includes('/')){status('Ingresá un UID válido.');return;}void open(target);};
$('saveProfile').onclick=async()=>{if(!isAdmin)return;const target=$('targetUid').value.trim();if(!target||target.includes('/')){status('Ingresá un UID válido.');return;}try{await setDoc(doc(db,'profiles',target),{enabled:$('enabled').checked,label:$('profileLabel').value.trim()});status('Acceso actualizado para '+target+'. Esto no crea ni elimina cuentas de Authentication.');}catch(e){error(e);}};
$('backup').onchange=async()=>{plan=null;$('confirmOwner').checked=false;$('importBackup').disabled=true;const session=generation;try{if(!current||busy||failed)throw Error('Abrí un espacio disponible antes de importar.');const file=$('backup').files[0];if(!file)return;if(file.size>30000000)throw Error('Archivo demasiado grande para esta versión de prueba (30 MB).');const parsed=JSON.parse(await file.text());if(session!==generation)return;plan=mergeBackup(current,parsed);$('review').textContent=JSON.stringify({titular:uid,revision,antes:plan.before,respaldo:plan.source,despues:plan.after,duplicadosIdenticos:plan.duplicates},null,2);$('importBackup').disabled=!$('confirmOwner').checked;status('Revisá titular, cantidades, fotos, adjuntos y totales antes de confirmar.');}catch(e){error(e);}};
$('confirmOwner').onchange=()=>{$('importBackup').disabled=!plan||!$('confirmOwner').checked||busy||failed;};
$('importBackup').onclick=async()=>{if(!plan||!$('confirmOwner').checked||busy||failed)return;const expected=plan.after;await persist(plan.data);if(!failed&&current){if(JSON.stringify(totals(current))!==JSON.stringify(expected)){failed=true;status('Error: los totales no coinciden. Descargá el respaldo y no continúes.');return;}draw();status('Importación confirmada. Totales verificados. Los datos locales originales permanecen intactos.');}};
$('download').onclick=()=>{if(!pending)return;const url=URL.createObjectURL(new Blob([JSON.stringify(pending,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='jat-vet-v4-pendiente-'+uid+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
window.addEventListener('beforeunload',e=>{if(busy||pending){e.preventDefault();e.returnValue='';}});
async function boot(){try{const response=await fetch('./firebase-config.json',{cache:'no-store'});if(!response.ok)throw Error('Falta firebase-config.json: obtené la configuración web de la app registrada en jat-vet-pruebas. No se inició ninguna migración.');const config=validateConfig(await response.json());const app=initializeApp(config);auth=getAuth(app);db=getFirestore(app);if(['127.0.0.1','localhost'].includes(location.hostname)&&new URLSearchParams(location.search).get('emulators')==='1'){connectAuthEmulator(auth,'http://127.0.0.1:9199');connectFirestoreEmulator(db,'127.0.0.1',8180);}await setPersistence(auth,browserSessionPersistence);onAuthStateChanged(auth,async account=>{clear();user=account;isAdmin=false;if(account){try{isAdmin=hasAdminClaim((await getIdTokenResult(account)).claims);}catch(e){error(e);return;}}$('login').hidden=!!account;$('workspace').hidden=!account;$('logout').hidden=!account;$('admin').hidden=!isAdmin;$('identity').textContent=account?.email||'';if(account)await open(account.uid);else status('Ingresá con tu cuenta.');},error);}catch(e){error(e);}}
void boot();
