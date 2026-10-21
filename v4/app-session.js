// Session and recovery state stays in this module's closure, never in web storage.
// Only the authenticated owner may see/download their unconfirmed snapshot.
export function boot(deps, mountLegacy) {
  const {validateConfig, hasAdminClaim, initializeApp, onAuthStateChanged, totals,
    signInWithEmailAndPassword, doc, browserSessionPersistence, getIdTokenResult,
    same, getFirestore, getAuth, validateBackup, connectAuthEmulator, mergeBackup,
    connectFirestoreEmulator, repository, setDoc, sendPasswordResetEmail, signOut,
    setPersistence} = deps;
  const $ = id => document.getElementById(id);
  const pending = new Map();
  let auth, db, user, uid, repo, current, revision=0, generation=0, saving=false;
  let blocked='', timer, unsubscribe, plan, admin=false, verifying=false;
  const emulator = ['127.0.0.1','localhost'].includes(location.hostname) &&
    new URLSearchParams(location.search).get('emulators') === '1';
  const status = text => { $('status').textContent=text; };
  const ownPending = () => user && pending.get(user.uid);

  // The recovery surface is outside the clinical workspace, including on revocation.
  const recovery=document.createElement('section');
  recovery.id='recoveryPanel'; recovery.hidden=true;
  recovery.style.cssText='max-width:680px;margin:16px auto;padding:20px;background:#fff;border:1px solid #bdd5e5;border-radius:16px;font:15px system-ui;color:#173a55';
  recovery.innerHTML='<h2>Copia de recuperación pendiente</h2><p>Hay cambios sin confirmar de tu sesión. Descargá una copia antes de salir. La copia permanece solo en esta pestaña; cerrar o recargar puede perderla.</p><button id="retryPending" type="button">Revisar y reintentar guardado</button><button id="discardPending" type="button">Descartar copia ya descargada</button>';
  recovery.appendChild($('download')); document.body.appendChild(recovery);
  const notice=document.createElement('section');
  notice.id='accessNotice'; notice.hidden=true; notice.setAttribute('role','alert');
  notice.style.cssText='max-width:560px;margin:42px auto;padding:28px;background:#fff;border:1px solid #e1e8ee;border-radius:16px;text-align:center;font:16px system-ui;color:#173a55';
  notice.innerHTML='<h2 id="connectionTitle"></h2><p id="connectionMessage"></p><button id="connectionRetry" type="button">Reintentar</button><button id="accessLogout" type="button">Cerrar sesión</button>';
  document.body.appendChild(notice);
  function refreshRecovery() {
    const entry=ownPending();
    recovery.hidden=!entry;
    $('download').hidden=!entry;
    $('retryPending').hidden=!entry || blocked==='revoked' || !navigator.onLine;
    $('retryPending').disabled=saving;
    $('discardPending').hidden=!entry?.downloaded;
    $('discardPending').disabled=saving;
  }
  function freeze(reason) {
    document.body.classList.add('jat-ready');
    blocked=reason; $('workspace').hidden=true; $('editor').inert=true;
    $('settings').hidden=true; notice.hidden=false;
    $('connectionTitle').textContent=reason==='offline'?'Sin conexión':reason==='conflict'?'Hay cambios de otra sesión':'Acceso no disponible';
    $('connectionMessage').textContent=reason==='offline'?
      'JAT Vet necesita Internet para funcionar. No se permiten operaciones clínicas sin conexión. Tus cambios pendientes siguen disponibles para recuperar.':
      reason==='conflict'?'No se sobrescribieron los datos de otra sesión. Descargá tu copia pendiente y revisá los datos actualizados.':
      'Tu cuenta está suspendida, vencida o no tiene acceso. Podés recuperar tu copia pendiente sin volver a habilitar el acceso.';
    $('connectionRetry').hidden=reason==='revoked';
    refreshRecovery();
  }
  function clearWorkspace() {
    generation++; clearInterval(timer); timer=null; unsubscribe?.(); unsubscribe=null;
    repo=null; current=null; uid=null; plan=null; saving=false; blocked='';
    $('editor').__disposeLegacy?.(); $('editor').replaceChildren(); $('editor').inert=true;
    $('workspace').hidden=true; $('settings').hidden=true; $('settings').open=false;
    $('review').textContent=''; $('backup').value=''; $('confirmOwner').checked=false;
    $('importBackup').disabled=true; notice.hidden=true;
    $('targetUid').value=''; $('profileLabel').value=''; $('enabled').checked=true;
    $('admin').hidden=true; $('identity').textContent=''; $('password').value='';
    // Do not erase pending: an auth change must hide, not destroy, the owner's copy.
    refreshRecovery();
  }
  function expiryValid(profile) {
    if (!('expiry' in profile) || profile.expiry.stringValue==='') return true;
    const value=profile.expiry.stringValue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value||'')) return false;
    const end=Date.parse(value+'T00:00:00-03:00')+86400000;
    return Number.isFinite(end) && Date.now()<end;
  }
  async function verifyAccess(owner) {
    const account=user;
    if (!account || account.uid!==owner) throw Object.assign(Error('Sesión inválida'),{code:'session-changed'});
    if (!navigator.onLine) throw Object.assign(Error('Sin conexión'),{code:'access-offline'});
    const token=await account.getIdToken();
    const base=emulator?'http://127.0.0.1:8180':'https://firestore.googleapis.com';
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
    let profile;
    try {
      const response=await fetch(`${base}/v1/projects/jat-vet-pruebas/databases/(default)/documents/profiles/${encodeURIComponent(owner)}`,
        {headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:controller.signal});
      if (user!==account) throw Object.assign(Error('Cambió la sesión'),{code:'session-changed'});
      if (!response.ok) throw Object.assign(Error('No se pudo verificar el acceso'),
        {code:[401,403,404].includes(response.status)?'permission-denied':'access-offline'});
      profile=(await response.json()).fields||{};
    } catch(err) {
      if(['permission-denied','session-changed','access-offline'].includes(err.code))throw err;
      throw Object.assign(Error('No se pudo verificar la conexión'),{code:'access-offline'});
    } finally {clearTimeout(timeout);}
    if (user!==account) throw Object.assign(Error('Cambió la sesión'),{code:'session-changed'});
    if (profile.enabled?.booleanValue!==true || !expiryValid(profile))
      throw Object.assign(Error('Cuenta suspendida o vencida'),{code:'permission-denied'});
  }
  function error(err) {
    document.body.classList.add('jat-ready');
    if (err.code==='session-changed') return;
    if (err.code==='permission-denied') { freeze('revoked'); status('Acceso bloqueado. La copia pendiente de su propietario no se borró.'); }
    else if (err.code==='access-offline'||err.code==='unavailable'||err.code==='auth/network-request-failed'||!navigator.onLine) {
      freeze('offline'); status('Sin conexión. Conservamos los cambios pendientes para recuperar.');
    } else status(err.code?.startsWith('auth/')?'No se pudo ingresar. Revisá el correo y la contraseña.':err.message||'No se pudo completar la operación.');
    refreshRecovery();
  }
  function openBackup() {
    if (!current || saving || blocked || !user || uid!==user.uid || ownPending()) return;
    plan=null; $('settings').hidden=false; $('settings').open=true;
    $('backup').value=''; $('review').textContent=''; $('confirmOwner').checked=false;
    $('importBackup').disabled=true;
  }
  function draw() {
    const session=generation,owner=user?.uid;
    mountLegacy($('editor'),current,data=>{if(session===generation&&user?.uid===owner)void persist(data)},user?.email?.split('@')[0]||'Usuario',
      {openBackup,importBackup:json=>void reviewBackup(json)});
    $('editor').inert=!!blocked||saving;
  }
  async function persist(data, retryEntry=null) {
    if (!user || !repo || uid!==user.uid || saving || blocked==='revoked'||blocked==='conflict') return false;
    const owner=user.uid, session=generation, activeRepo=repo;
    const previous=pending.get(owner);
    if(retryEntry && previous!==retryEntry) return false;
    if (previous && previous!==retryEntry) { status('Recuperá o resolvé la copia pendiente antes de realizar nuevos cambios.'); return false; }
    const entry=retryEntry||{data:structuredClone(data),revision,downloaded:false};
    pending.set(owner,entry); saving=true; $('editor').inert=true;
    $('importBackup').disabled=true; refreshRecovery(); status('Guardando cambios…');
    try {
      const validated=validateBackup(entry.data);
      await verifyAccess(owner);
      if(session!==generation || user?.uid!==owner) return false;
      const next=await activeRepo.save(validated,entry.revision,owner);
      const stored=await activeRepo.read();
      if(stored.revision!==next||!same(stored.data,validated)) throw Error('No se pudo verificar la revisión guardada.');
      if(session!==generation || user?.uid!==owner) return false;
      revision=next; current=structuredClone(stored.data);
      if(pending.get(owner)===entry) pending.delete(owner); // Only an exact, verified commit clears pending.
      plan=null; $('review').textContent=''; status('Cambios guardados.'); return true;
    } catch(err) {
      if(session!==generation || user?.uid!==owner) return false;
      if(/Otro dispositivo|revisión diferente/.test(err.message)) freeze('conflict'); else error(err);
      status($('status').textContent+' Conservamos la copia pendiente: descargala antes de salir.');
      return false;
    } finally {
      if(session===generation){saving=false; $('editor').inert=!!blocked||!!ownPending(); refreshRecovery();}
    }
  }
  async function checkSession() {
    if(verifying||!user||!uid) return;
    verifying=true; const session=generation,owner=user.uid;
    try { await verifyAccess(owner); }
    catch(err){if(session===generation) error(err);}
    finally{verifying=false;}
  }
  async function open(owner) {
    const session=generation;
    uid=owner; repo=repository(db,owner); status('Verificando acceso…');
    try {
      await verifyAccess(owner);
      const stored=await repo.read();
      if(session!==generation || user?.uid!==owner) return;
      current=stored.data; revision=stored.revision; blocked=''; notice.hidden=true;
      draw(); $('workspace').hidden=false;
      if(ownPending()) { $('editor').inert=true; status('Hay una copia pendiente de tu sesión. Descargala o revisá el guardado antes de continuar.'); }
      else status('');
      unsubscribe?.(); unsubscribe=repo.watch(remote=>{
        if(session===generation && remote!==revision && !saving) { freeze('conflict'); status('Otra sesión modificó los datos. No se sobrescribirá su revisión.'); }
      },err=>{if(session===generation) error(err)});
      clearInterval(timer); timer=setInterval(()=>void checkSession(),12000);
      refreshRecovery();
    } catch(err){if(session===generation) error(err);}
  }
  async function retryConnection() {
    if(!user||saving) return;
    // Revalidate with the server; never replay a pending write automatically.
    clearInterval(timer); unsubscribe?.(); unsubscribe=null;
    await open(user.uid);
  }
  async function logout() {
    const entry=ownPending();
    if(saving){status('Esperá la confirmación del guardado o descargá tu copia antes de cerrar sesión.');return;}
    if(entry&&!entry.downloaded){status('Descargá primero la copia pendiente. Cerrar sesión no la guardará en Firestore.');refreshRecovery();return;}
    if(confirm('¿Estás seguro de que querés cerrar sesión?')) try{await signOut(auth)}catch(err){error(err)}
  }
  $('logout').onclick=logout; $('accessLogout').onclick=logout;
  $('connectionRetry').onclick=()=>void retryConnection();
  $('reloadWorkspace').onclick=()=>void retryConnection();
  $('retryPending').onclick=async()=>{
    const entry=ownPending(); if(!entry||saving) return;
    const owner=user.uid,session=generation,activeRepo=repo;
    try{
      await verifyAccess(owner);
      if(session!==generation||user?.uid!==owner||!activeRepo)return;
      const stored=await activeRepo.read();
      if(session!==generation||user?.uid!==owner||ownPending()!==entry)return;
      if(stored.revision!==entry.revision){freeze('conflict');status('La revisión cambió. Descargá la copia pendiente; no se sobrescribieron los datos.');return;}
      if(confirm('¿Reintentar el guardado de tu copia pendiente en la misma revisión?')){
        blocked=''; notice.hidden=true;
        if(await persist(entry.data,entry)) { draw(); $('workspace').hidden=false; }
      }
    }catch(err){if(session===generation&&user?.uid===owner)error(err)}
  };
  $('discardPending').onclick=async()=>{
    const entry=ownPending(); if(!entry?.downloaded||saving)return;
    if(!confirm('¿Descartar explícitamente esta copia pendiente ya descargada? Los datos confirmados no cambian.'))return;
    pending.delete(user.uid);refreshRecovery();
    if(!blocked)await retryConnection();
  };
  $('download').onclick=()=>{
    const owner=user?.uid,entry=ownPending(); if(!owner||!entry) return;
    const url=URL.createObjectURL(new Blob([JSON.stringify(entry.data,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=`jat-vet-v4-pendiente-${owner}.json`;
    link.click();entry.downloaded=true;refreshRecovery();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  async function reviewBackup(json) {
    if(!current||saving||blocked||ownPending()||uid!==user?.uid) return;
    plan=null; $('confirmOwner').checked=false; $('importBackup').disabled=true;
    try{
      if(typeof json!=='string'||json.length>30000000) throw Error('Respaldo inválido o demasiado grande.');
      plan=mergeBackup(current,JSON.parse(json));
      $('review').textContent=JSON.stringify({titular:uid,revision,antes:plan.before,respaldo:plan.source,despues:plan.after,duplicadosIdenticos:plan.duplicates},null,2);
      $('settings').hidden=false;$('settings').open=true;
      status('Revisá titular, cantidades, fotos, adjuntos y totales antes de confirmar.');
    }catch(err){error(err)}
  }
  $('backup').onchange=async()=>{
    const file=$('backup').files[0]; if(!file)return;
    if(file.size>30000000){status('Archivo demasiado grande (30 MB).');return;}
    const session=generation,text=await file.text();if(session===generation)await reviewBackup(text);
  };
  $('confirmOwner').onchange=()=>{$('importBackup').disabled=!plan||!$('confirmOwner').checked||saving||!!blocked;};
  $('importBackup').onclick=async()=>{
    if(!plan||!$('confirmOwner').checked||saving||blocked||ownPending())return;
    const selected=plan,session=generation;
    const url=URL.createObjectURL(new Blob([JSON.stringify(current,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=`jat-vet-antes-de-restaurar-${uid}-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
    if(!confirm('Verificá que descargaste la copia previa. ¿Confirmás la importación revisada?'))return;
    if(await persist(selected.data) && generation===session){
      if(!same(totals(current),selected.after)){freeze('conflict');return;}
      draw();status('Importación confirmada. Totales verificados.');
    }
  };
  $('loginForm').onsubmit=async event=>{
    event.preventDefault();try{await signInWithEmailAndPassword(auth,$('email').value.trim(),$('password').value);$('password').value='';}catch(err){error(err)}
  };
  function resetMessage(message){
    let dialog=$('jatResetDialog');
    if(!dialog){dialog=document.createElement('dialog');dialog.id='jatResetDialog';dialog.style.cssText='border:0;border-radius:18px;padding:28px;max-width:min(90vw,390px);box-shadow:0 18px 55px #142a4060;text-align:center;font:16px system-ui;color:#173a55';dialog.innerHTML='<div style="font-size:36px;margin-bottom:12px">✉️</div><p id="jatResetMessage" style="line-height:1.5"></p><button id="jatResetClose" type="button" style="background:#176caa;color:white;border:0;border-radius:10px;padding:12px 28px;font-weight:700;cursor:pointer">Entendido</button>';document.body.appendChild(dialog);$('jatResetClose').onclick=()=>dialog.close();}
    $('jatResetMessage').textContent=message;if(!dialog.open)dialog.showModal();
  }
  $('reset').onclick=async()=>{
    if(!$('email').checkValidity()||!$('email').value.trim()){resetMessage('Ingresá un correo válido para recuperar tu contraseña.');return;}
    $('reset').disabled=true;
    try{await sendPasswordResetEmail(auth,$('email').value.trim());resetMessage('Si el correo corresponde a una cuenta, recibirá instrucciones de recuperación.');}
    catch(err){error(err);resetMessage('No pudimos procesar la solicitud. Intentá nuevamente.');}
    finally{$('reset').disabled=false;}
  };
  $('openWorkspace').onclick=()=>{if(admin&&$('targetUid').value.trim()===user?.uid)void retryConnection();};
  $('saveProfile').onclick=async()=>{
    if(!admin)return;const target=$('targetUid').value.trim();if(!target||target.includes('/'))return;
    try{await setDoc(doc(db,'profiles',target),{enabled:$('enabled').checked,label:$('profileLabel').value.trim()},{merge:true});status('Acceso actualizado.');}catch(err){error(err)}
  };
  window.addEventListener('offline',()=>{if(user)freeze('offline');});
  window.addEventListener('online',()=>{if(user&&blocked==='offline')status('Conexión recuperada. Pulsá Reintentar para verificar el acceso.');});
  window.addEventListener('beforeunload',event=>{if(pending.size||saving){event.preventDefault();event.returnValue='';}});
  (async()=>{try{
    const response=await fetch('./firebase-config.json',{cache:'no-store'});
    if(!response.ok)throw Error('Falta firebase-config.json.');
    const config=validateConfig(await response.json()),app=initializeApp(config);
    auth=getAuth(app);db=getFirestore(app);
    if(emulator){connectAuthEmulator(auth,'http://127.0.0.1:9299');connectFirestoreEmulator(db,'127.0.0.1',8180);}
    await setPersistence(auth,browserSessionPersistence);
    onAuthStateChanged(auth,async account=>{
      user=null;clearWorkspace();user=account;admin=false;
      $('login').hidden=!!account;$('logout').hidden=!account;$('identity').textContent=account?.email||'';
      refreshRecovery();
      if(!account){status('Ingresá con tu cuenta.');return;}
      const session=generation;
      try{admin=hasAdminClaim((await getIdTokenResult(account)).claims);if(session!==generation||user!==account)return;$('admin').hidden=!admin;await open(account.uid);}catch(err){if(session===generation)error(err)}
    },error);
  }catch(err){error(err)}})();
}
