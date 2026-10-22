/* JAT Vet v4 — navegaciones desde red, sin cachear datos clínicos. */
const SW_VERSION='v4.0.2-rc1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  if(event.request.mode!=='navigate')return;
  event.respondWith((async()=>{
    try{
      return await fetch(new Request(event.request,{cache:'no-store'}));
    }catch(error){
      return new Response(
        '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JAT Vet · Sin conexión</title><main style="font:16px system-ui;max-width:30rem;margin:12vh auto;padding:1.5rem;color:#173a55"><h1>Sin conexión</h1><p>No pudimos conectar con JAT Vet. Tus datos no se modificaron.</p><p>Verificá Internet y volvé a intentar.</p><button onclick="location.reload()" style="padding:12px 18px;border:0;border-radius:10px;background:#247eb7;color:white">Reintentar</button></main></html>',
        {status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}}
      );
    }
  })());
});
