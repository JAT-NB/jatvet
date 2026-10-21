import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

let published='4.0.0';
const installer=await readFile(new URL('./install.js',import.meta.url),'utf8');
const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body><button id="installApp" hidden>Instalar</button><input id="dato"><button id="guardar">Guardar</button><div id="resultado"></div><script>document.getElementById('dato').value=localStorage.getItem('qa-update-dato')||'';document.getElementById('guardar').onclick=()=>localStorage.setItem('qa-update-dato',document.getElementById('dato').value);document.getElementById('resultado').textContent=localStorage.getItem('qa-update-dato')||'';</script><script src="/jatvet/install.js"></script></body></html>`;
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  res.setHeader('Cache-Control','no-store');
  if(url.pathname==='/jatvet/version.json'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({version:published}));return;}
  if(url.pathname==='/jatvet/install.js'){res.setHeader('Content-Type','text/javascript');res.end(installer.replace("const runningVersion = '4.0.0'","const runningVersion = '"+published+"'"));return;}
  if(url.pathname==='/jatvet/sw.js'){res.setHeader('Content-Type','text/javascript');res.end("self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));");return;}
  if(url.pathname==='/jatvet/'||url.pathname==='/jatvet'){res.setHeader('Content-Type','text/html');res.end(html);return;}
  res.writeHead(404);res.end('Not found');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext();
  const page=await context.newPage();
  const base='http://127.0.0.1:'+server.address().port+'/jatvet/';
  await page.goto(base);
  await page.locator('#dato').fill('PRUEBA PERSISTENCIA 123');
  await page.locator('#guardar').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('qa-update-dato')),'PRUEBA PERSISTENCIA 123');
  published='4.0.1';
  await page.reload();
  // Simulate an old open tab: install.js must remain v4.0.0 while the server serves v4.0.1.
  // Reload above loaded the new script, so start a fresh tab before publishing in a separate scenario.
  await page.close();
  published='4.0.0';
  const old=await context.newPage();
  await old.goto(base);
  published='4.0.1';
  await old.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await old.getByRole('button',{name:'Actualizar ahora'}).waitFor({timeout:10000});
  await Promise.all([old.waitForNavigation({timeout:10000}),old.getByRole('button',{name:'Actualizar ahora'}).click()]);
  assert.equal(await old.evaluate(()=>localStorage.getItem('qa-update-dato')),'PRUEBA PERSISTENCIA 123');
  const banner=await old.getByRole('button',{name:'Actualizar ahora'}).count();
  assert.equal(banner,0,'New version should not offer the same update again');
  console.log('PASS: browser real navigation 4.0.0 -> 4.0.1, localStorage retained, no repeated notice');
  await old.close();
  await context.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
