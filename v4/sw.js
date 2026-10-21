/* JAT Vet v4 - navegaciones siempre desde red; nunca cachear HTML ni datos. */
const SW_VERSION='v4-network-20261021';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  if(event.request.mode!=='navigate')return;
  event.respondWith((async()=>{
    try{
      return await fetch(new Request(event.request,{cache:'no-store'}));
    }catch(error){
      return Response.error();
    }
  })());
});
