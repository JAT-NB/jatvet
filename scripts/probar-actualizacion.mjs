import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=readFileSync('install.js','utf8');
async function scenario(publishedInstallerVersion,expectedReload){
 const elements=[];
 const make=()=>({style:{},hidden:true,isConnected:false,textContent:'',addEventListener(name,fn){this[name]=fn},setAttribute(){},append(){},classList:{add(){}}});
 const install=make(),body={append(node){node.isConnected=true}};
 const document={readyState:'complete',hidden:false,body,getElementById(){return install},createElement(){const e=make();elements.push(e);return e},addEventListener(){}};
 let reloads=0;
 const location={href:'https://example.test/jatvet/',origin:'https://example.test',replace(){reloads++}};
 const fetch=async url=>{
  const u=String(url);
  if(u.includes('version.json'))return {ok:true,json:async()=>({version:'4.0.1'})};
  if(u.includes('install.js'))return {ok:true,text:async()=>`const runningVersion = '${publishedInstallerVersion}';`};
  if(u.includes('/jatvet/?'))return {ok:true,text:async()=>'<script src="/jatvet/install.js?v=4.0.1"></script>'};
  throw Error('unexpected '+u);
 };
 const window={matchMedia:()=>({matches:false}),addEventListener(){}};
 const navigator={userAgent:'Test',platform:'Test',maxTouchPoints:0};
 const context={document,window,navigator,location,fetch,URL,setInterval(){},console,Date};
 vm.runInNewContext(code,context);
 await new Promise(resolve=>setImmediate(resolve));
 const button=elements.find(e=>e.textContent==='Actualizar ahora');
 assert.ok(button,'update button must appear');
 await button.click();
 assert.equal(reloads,expectedReload,'reload only after installer version verified');
}
await scenario('4.0.0',0);
await scenario('4.0.1',1);
console.log('PASS: incomplete publication does not reload; complete publication reloads.');
