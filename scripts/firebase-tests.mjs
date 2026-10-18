import {spawn} from 'node:child_process';
function run(cmd,args,env=process.env){return new Promise((resolve,reject)=>{const child=spawn(cmd,args,{stdio:'inherit',env});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(cmd+' terminó con '+code)));});}
const url='http://127.0.0.1:5180/v4/';let server;
try{
 await run(process.execPath,['--test','tests/rules.integration.mjs']);
 // Own the server so failures cannot accidentally target another checkout.
 let occupied=false;try{await fetch('http://127.0.0.1:5180/');occupied=true;}catch{}if(occupied)throw Error('Cerrá el servidor que usa el puerto 5180 antes de ejecutar la entrega.');
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5180','--strictPort'],{stdio:'inherit'});
 let exited=false;server.on('exit',()=>exited=true);let ready=false;
 for(let i=0;i<100&&!exited;i++){try{if((await fetch(url)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
 if(!ready||exited)throw Error('El servidor de pruebas no inició en el puerto 5180.');
 await run(process.execPath,['tests/browser.mjs'],{...process.env,JAT_TEST_AUTH:'1',JAT_TEST_FIRESTORE:'1'});
}finally{server?.kill('SIGTERM');}
