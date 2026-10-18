import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {chromium} from 'playwright';
import {readFile,mkdir,writeFile,rm} from 'node:fs/promises';
import {randomBytes,randomUUID,createHmac} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {PROJECT_ID,validateConfig} from '../v4/environment.js';
process.chdir(fileURLToPath(new URL('..',import.meta.url)));
const npm=process.platform==='win32'?'npm.cmd':'npm';
const firebase=['node_modules/firebase-tools/lib/bin/firebase.js'];
async function run(command,args,{capture=false}={}){return new Promise((resolve,reject)=>{const child=spawn(command,args,{stdio:capture?['ignore','pipe','inherit']:'inherit',env:process.env});let output='';if(capture)child.stdout.on('data',chunk=>output+=chunk);child.on('error',reject);child.on('exit',code=>code===0?resolve(output):reject(Error(command+' finalizó con '+code)));});}
async function cli(args,json=false){const output=await run(process.execPath,[...firebase,...args,'--project',PROJECT_ID,...(json?['--json']:[])],{capture:json});if(!json)return;const response=JSON.parse(output);if(response.status!=='success')throw Error('Firebase rechazó la operación.');return response.result;}
let server;
try{
 const branch=(await run('git',['branch','--show-current'],{capture:true})).trim();if(branch!=='desarrollo-v4-firebase')throw Error('La entrega sólo se ejecuta desde desarrollo-v4-firebase.');
 validateConfig(JSON.parse(await readFile('public/v4/firebase-config.json','utf8')));
 await run(npm,['test']);await run(npm,['run','build']);if(!process.env.JAT_CHROMIUM_PATH&&!existsSync('/usr/bin/chromium')&&!existsSync(chromium.executablePath()))await run(process.execPath,['node_modules/playwright/cli.js','install','chromium']);
 // Must pass before any remote write. This gate intentionally fails closed on download/network errors.
 await run(npm,['run','test:firebase']);
 try{await cli(['hosting:sites:list'],true);}catch{console.log('Autorizá Firebase CLI con tu cuenta de Google para el proyecto de pruebas.');await run(process.execPath,[...firebase,'login']);}
 const listing=await cli(['hosting:sites:list'],true);if(!listing.sites.some(site=>site.name.split('/').at(-1)===PROJECT_ID))await cli(['hosting:sites:create',PROJECT_ID]);
 // Random synthetic accounts only: never reuse or import any real user/backup.
 const nonce=randomUUID(),key=randomBytes(32);const accounts={};const users=[];
 for(const role of ['admin','a','b']){const uid='v4-test-'+role+'-'+nonce,email='jatvet-v4-test-'+role+'-'+nonce+'@example.test',password=randomBytes(24).toString('base64url');accounts[role]={uid,email,password};users.push({localId:uid,email,displayName:'JAT Vet PRUEBA '+role,passwordHash:createHmac('sha256',key).update(password).digest('base64'),customAttributes:JSON.stringify(role==='admin'?{jatvetAdmin:true}:{})});}
 await mkdir('.test-secrets',{mode:0o700,recursive:true});const file='.test-secrets/accounts-'+nonce+'.json',importFile='.test-secrets/import-'+nonce+'.json';await writeFile(file,JSON.stringify({projectId:PROJECT_ID,accounts},null,2),{mode:0o600});await writeFile(importFile,JSON.stringify({users}),{mode:0o600});
 try{await cli(['auth:import',importFile,'--hash-algo','HMAC_SHA256','--hash-key',key.toString('base64')]);}finally{await rm(importFile,{force:true});}
 await cli(['deploy','--only','firestore:rules,firestore:indexes','--config','firebase.json']);
 // Validate the live development backend before exposing the app through a preview URL.
 let occupied=false;try{await fetch('http://127.0.0.1:5180/');occupied=true;}catch{}if(occupied)throw Error('Cerrá el servidor que usa el puerto 5180 antes de ejecutar la entrega.');
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5180','--strictPort'],{stdio:'inherit'});let exited=false;server.on('exit',()=>exited=true);let ready=false;
 for(let i=0;i<100&&!exited;i++){try{if((await fetch('http://127.0.0.1:5180/v4/diagnostico.html')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
 if(!ready||exited)throw Error('No inició el servidor de validación.');
 await run(process.execPath,['scripts/verify-live-tests.mjs',file]);
 const deployment=await cli(['hosting:channel:deploy','v4-prueba','--config','firebase.preview.json','--expires','7d'],true);const preview=Object.values(deployment).find(item=>item.site===PROJECT_ID||item.url)?.url;
 if(!preview||!new URL(preview).hostname.endsWith('.web.app'))throw Error('Firebase no devolvió una URL de preview válida.');
 await run(process.execPath,['scripts/verify-live-tests.mjs',file,preview,'preview']);
 await writeFile('.test-secrets/preview.json',JSON.stringify({projectId:PROJECT_ID,url:preview,accountsFile:file},null,2),{mode:0o600});
 console.log('Preview verificada: '+preview);console.log('Credenciales sintéticas guardadas sólo en '+file+' (no compartir ni commitear).');
}catch(error){console.error('Entrega detenida: '+error.message);console.error('No se desplegó Hosting live ni se cambió main. Consultá los pasos completados antes de reintentar.');process.exitCode=1;}finally{server?.kill('SIGTERM');}
