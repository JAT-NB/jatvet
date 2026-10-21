// Execute the actual candidate date helper at deterministic midnight boundaries.
// The temporary test-only rules expose no clinical paths and are restored in finally.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');const {getDoc,doc,setDoc}=require('firebase/firestore');
async function main(){
 const candidate=fs.readFileSync(path.join(__dirname,'firestore.proposed.rules'),'utf8');
 const helpers=candidate.slice(candidate.indexOf('    function validExpiry('),candidate.indexOf('    function adminActive('));
 assert(helpers.includes('function datedExpiry(value, instant)'));
 const deadline="timestamp.date(2026,10,22) + duration.value(3,'h')";
 const cases=[['EXP-16','Último nanosegundo del día argentino permitido','before',`${deadline} - duration.value(1,'ns')`,true],['EXP-17','Medianoche siguiente argentina denegada','at',deadline,false],['EXP-18','Después de medianoche argentina denegado','after',`${deadline} + duration.value(1,'ns')`,false]];
 const matches=cases.map(([, ,id,time])=>`match /boundary/${id} {allow get: if datedExpiry('2026-10-21', ${time});}`).join('\n');
 const testRules=`rules_version = '2';service cloud.firestore {match /databases/{database}/documents {${helpers}\n${matches}}}`;
 let env;const results=[];
 try{
  env=await initializeTestEnvironment({projectId:'jat-vet-pruebas',firestore:{host:'127.0.0.1',port:8180,rules:testRules}});
  const db=env.authenticatedContext('qa-boundary').firestore();
  for(const[id,title,key,instant,allowed]of cases){try{if(allowed)await getDoc(doc(db,'boundary',key));else await assert.rejects(getDoc(doc(db,'boundary',key)),e=>e.code==='permission-denied');results.push({id,title,status:'PASS',instant,allowed});}catch(e){results.push({id,title,status:'FAIL',error:e.stack})}}
 }finally{
  await env?.cleanup();
  const restored=await initializeTestEnvironment({projectId:'jat-vet-pruebas',firestore:{host:'127.0.0.1',port:8180,rules:candidate}});
  try{
   await restored.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'profiles','qa-expired-admin'),{enabled:true,label:'QA admin vencido',expiry:'2000-01-01'}));
   const db=restored.authenticatedContext('qa-expired-admin',{jatvetAdmin:true}).firestore();
   await assert.rejects(getDoc(doc(db,'workspaces','vet-a')),e=>e.code==='permission-denied');
   await assert.rejects(setDoc(doc(db,'profiles','qa-expired-admin'),{enabled:true,label:'Reactivar'}),e=>e.code==='permission-denied');
   results.push({id:'EXP-19',title:'Admin vencido no accede ni elimina su vencimiento',status:'PASS'});
  }catch(e){results.push({id:'EXP-19',title:'Admin vencido no accede ni elimina su vencimiento',status:'FAIL',error:e.stack})}
  finally{await restored.cleanup()}
 }
 fs.writeFileSync(path.resolve(__dirname,'../resultados/correcciones/expiry-boundary.json'),JSON.stringify({timestamp:new Date().toISOString(),scope:'Helper exacto extraído de reglas propuestas, invocado con instantes deterministas en reglas temporales de prueba; reglas propuestas completas restauradas al finalizar.',results},null,2));for(const r of results)console.log(r.status,r.id,r.title);process.exitCode=results.some(r=>r.status==='FAIL')?1:0;
}
main().catch(e=>{console.error(e);process.exitCode=2});
