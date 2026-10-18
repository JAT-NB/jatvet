import {emptyData,mergeBackup,same,totals} from './data.js';
export function checkIdentities({admin,a,b,secondA}){
 if(admin.isAdmin!==true)throw Error('La cuenta de pruebas no tiene el permiso administrativo jatvetAdmin.');
 if(a.uid===b.uid||[a.uid,b.uid].includes(admin.uid)||secondA.uid!==a.uid)throw Error('Las identidades de prueba deben ser dos profesionales distintos y una segunda sesión del profesional A.');
 for(const client of [a,b])if(!/^jatvet-v4-test[-+]/i.test(client.email||''))throw Error('Usá exclusivamente cuentas con correo que comience con jatvet-v4-test- o jatvet-v4-test+.');
}
export function syntheticBackup(run){return {...emptyData(),diagnosticRun:run,pets:[{id:run+'-p',pet:'Paciente sintético',species:'Canino',owner:'PRUEBA, sin datos reales',photo:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV0cAAAAASUVORK5CYII='}],services:[{id:run+'-s',name:'Servicio sintético',price:123}],turns:[{id:run+'-t',petId:run+'-p',serviceId:run+'-s',date:'2099-01-01',time:'12:00',status:'Pendiente',price:123}],studies:[{id:run+'-st',petId:run+'-p',type:'Archivo sintético',file:'data:application/pdf;base64,JVBERi0xLjQKJSVFT0Y='}],money:[{id:run+'-m',petId:run+'-p',kind:'Ingreso',amount:123,date:'2099-01-01'}],vaccinations:[{id:run+'-v',petId:run+'-p',name:'Vacuna sintética',date:'2099-01-01',expiry:'2099-02-01',price:0}]};}
async function denied(operation){try{await operation();}catch(e){if(e.code==='permission-denied')return;throw Error('El intento de aislamiento falló por otra causa: '+(e.code||e.message));}throw Error('FALLO DE SEGURIDAD: se permitió acceso a datos ajenos.');}
// The harness never receives real backup files. No writes until BOTH spaces pass preflight.
export async function verifyDevelopment(clients,report){
 checkIdentities(clients);const {admin,a,b,secondA}=clients;
 const ownA=a.repo(a.uid),ownB=b.repo(b.uid),beforeA=await ownA.read(),beforeB=await ownB.read();
 if(beforeA.revision!==0||beforeB.revision!==0||!same(beforeA.data,emptyData())||!same(beforeB.data,emptyData()))throw Error('Prueba cancelada sin escrituras: ambos espacios deben ser nuevos y estar vacíos. No se reemplaza ningún espacio existente.');
 report('PASS: administrador autenticado con permiso del proyecto de pruebas; dos profesionales de prueba; ambos espacios nuevos.');
 const run='v4-test-'+crypto.randomUUID(),backup=syntheticBackup(run),plan=mergeBackup(beforeA.data,backup);
 let revision=await ownA.save(plan.data,0,a.uid);const stored=await ownA.read();
 if(stored.revision!==revision||!same(stored.data,backup)||!same(totals(stored.data),plan.after))throw Error('No coincide el respaldo releído de Firestore.');
 report('PASS: escritura y lectura Firestore; migración sintética conserva registros, relaciones, fotos, adjuntos y totales.');
 if(!same(mergeBackup(stored.data,backup).data,stored.data))throw Error('La reimportación duplica datos.');report('PASS: reimportación sin duplicados.');
 if(!same((await secondA.repo(a.uid).read()).data,backup))throw Error('La segunda sesión no ve los datos.');report('PASS: segunda sesión Firebase observa la misma copia.');
 await denied(()=>b.repo(a.uid).read());await denied(()=>b.repo(a.uid).save(emptyData(),revision,b.uid));await denied(()=>a.repo(b.uid).read());report('PASS: lectura y escritura ajenas rechazadas con permission-denied.');
 const adminCopy=await admin.repo(a.uid).read();if(!same(adminCopy.data,backup))throw Error('El soporte de administrador no ve el espacio de prueba.');report('PASS: lectura de soporte del administrador sobre el profesional A.');
 const edit=structuredClone(backup);edit.pets[0].pet='Paciente sintético editado';revision=await ownA.save(edit,revision,a.uid);if(!same((await ownA.read()).data,edit))throw Error('Falló la edición.');report('PASS: edición persistida.');
 await ownB.save({...emptyData(),diagnosticRun:run,pets:[{id:run+'-b',pet:'Paciente exclusivo B'}]},0,b.uid);if((await ownB.read()).data.pets.length!==1)throw Error('Falló la escritura propia de B.');report('PASS: profesional B usa su propio espacio.');
 // Cleanup is separate and explicit. On any error this function stops; no automatic deletion.
 return {run,uids:[a.uid,b.uid]};
}
export async function cleanupSynthetic(clients,run){
 checkIdentities(clients);
 const targets=[];for(const c of [clients.a,clients.b]){const repo=c.repo(c.uid),snap=await repo.read();if(snap.data.diagnosticRun!==run)throw Error('No se limpia: el espacio no pertenece a esta ejecución.');for(const key of ['pets','turns','services','procedures','money','studies','vaccinations','audit'])for(const record of snap.data[key])if(!record.id.startsWith(run+'-'))throw Error('No se limpia: se encontró un registro ajeno a la prueba.');targets.push({c,repo,snap});}
 for(const {c,repo,snap} of targets){await repo.save(emptyData(),snap.revision,c.uid);if(!same((await repo.read()).data,emptyData()))throw Error('No se verificó la limpieza.');}
}
