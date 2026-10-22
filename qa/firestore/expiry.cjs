const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc}=require('firebase/firestore');
const out=path.resolve(__dirname,'../resultados/4.0.2-rc1/expiry-cases.json');
async function main(){
 const env=await initializeTestEnvironment({projectId:'jat-vet-pruebas',firestore:{host:'127.0.0.1',port:8180,rules:fs.readFileSync(path.join(__dirname,'firestore.proposed.rules'),'utf8')}});
 const {repository}=await import('./repository.mjs'),{emptyData}=await import('./data.mjs');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const shifted=n=>new Date(Date.parse(today+'T12:00:00-03:00')+n*86400000).toISOString().slice(0,10);
 const cases=[['EXP-01','Perfil legacy sin expiry',undefined,true,true],['EXP-02','Expiry vacío', '',true,true],['EXP-03','Ayer vencido',shifted(-1),true,false],['EXP-04','Hoy sigue vigente hasta fin del día argentino',today,true,true],['EXP-05','Mañana vigente',shifted(1),true,true],['EXP-06','Día inexistente','2026-02-30',true,false],['EXP-07','Formato no ISO','21/10/2099',true,false],['EXP-08','Bisiesto válido futuro','2096-02-29',true,true],['EXP-09','Bisiesto inválido','2099-02-29',true,false],['EXP-10','Tipo inválido legacy',42,true,false],['EXP-11','Suspendido con fecha futura','2099-12-31',false,false],['EXP-12','Suspendido sin vencimiento',undefined,false,false],['EXP-13','Mes inexistente','2099-13-01',true,false],['EXP-14','Fecha vacía parcial','2099-01-',true,false]];
 const results=[];
 for(const[id,title,expiry,enabled,allowed]of cases){
  const uid='qa-'+id.toLowerCase(),profile={enabled,label:'QA ficticio'};if(expiry!==undefined)profile.expiry=expiry;
  await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'profiles',uid),profile));
  const db=env.authenticatedContext(uid).firestore();
  try{
   if(allowed){await getDoc(doc(db,'workspaces',uid));const repo=repository(db,uid);await repo.save(emptyData(),(await repo.read()).revision,uid);}
   else{await assert.rejects(getDoc(doc(db,'workspaces',uid)),e=>e.code==='permission-denied');await assert.rejects(repository(db,uid).save(emptyData(),0,uid),e=>e.code==='permission-denied');}
   results.push({id,title,status:'PASS',allowed,profile});
  }catch(e){results.push({id,title,status:'FAIL',error:e.stack,profile});}
 }
 const uid='qa-suspended-admin';await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'profiles',uid),{enabled:false,label:'Admin QA'}));
 try{const db=env.authenticatedContext(uid,{jatvetAdmin:true}).firestore();await assert.rejects(getDoc(doc(db,'workspaces','vet-a')),e=>e.code==='permission-denied');await assert.rejects(setDoc(doc(db,'profiles',uid),{enabled:true,label:'Autoreactivación'}),e=>e.code==='permission-denied');results.push({id:'EXP-15',title:'Admin suspendido no accede ni se reactiva',status:'PASS'})}catch(e){results.push({id:'EXP-15',title:'Admin suspendido no accede ni se reactiva',status:'FAIL',error:e.stack})}
 fs.writeFileSync(out,JSON.stringify({timestamp:new Date().toISOString(),todayArgentina:today,policy:'ISO, día inclusivo Argentina UTC-03; ausencia/vacío compatible; inválido denegado',rules:'firestore.proposed.rules',results},null,2));
 for(const r of results)console.log(r.status,r.id,r.title);
 await env.cleanup();process.exitCode=results.some(r=>r.status==='FAIL')?1:0;
}
main().catch(e=>{console.error(e);process.exitCode=2});
