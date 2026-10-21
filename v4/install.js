let pendingInstall;
const button=document.getElementById('installApp');
const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();pendingInstall=event;if(!standalone())button.hidden=false;});
window.addEventListener('appinstalled',()=>{pendingInstall=null;button.hidden=true;});
const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(ios&&!standalone())button.hidden=false;
button.addEventListener('click',async()=>{if(pendingInstall){await pendingInstall.prompt();const result=await pendingInstall.userChoice;pendingInstall=null;button.hidden=true;}else if(ios){alert('Para instalar JAT Vet: abrí esta página en Safari, tocá Compartir y elegí “Agregar a pantalla de inicio”.');}});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});

/* Prueba aislada de actualización visual para el titular; no modifica Firebase. */
(()=>{
 const EMAIL='nbargiola@hotmail.com',KEY='jatvet-nico-402';
 const params=new URLSearchParams(location.search);
 const test=params.get('jatvet_prueba_actualizacion')==='1';
 const identity=()=>document.getElementById('identity')?.textContent?.trim().toLowerCase();
 let notice;
 function refresh(){
  if(identity()!==EMAIL)return;
  const header=document.querySelector('header .brand h1');
  if(localStorage.getItem(KEY)==='yes' && header && !document.getElementById('nicoRiverBadge')){
   const badge=document.createElement('span');badge.id='nicoRiverBadge';badge.textContent=' 🔴⚪🛡️';badge.title='River Plate';header.append(badge);
  }
  if(!test || localStorage.getItem(KEY)==='yes'||notice)return;
  notice=document.createElement('aside');
  notice.setAttribute('role','status');
  notice.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;max-width:410px;margin:auto;background:white;color:#123b50;padding:16px;border:1px solid #aac;border-radius:12px;box-shadow:0 8px 22px #0003;z-index:2147483647;font:14px system-ui';
  const title=document.createElement('p');title.textContent='JAT Vet 4.0.2: actualización visual de prueba disponible';
  const button=document.createElement('button');button.textContent='Actualizar ahora';button.type='button';
  button.style.cssText='background:#123b50;color:white;padding:10px;border:0;border-radius:8px';
  button.onclick=()=>{localStorage.setItem(KEY,'yes');const url=new URL(location.href);url.searchParams.delete('jatvet_prueba_actualizacion');url.searchParams.set('actualizado',Date.now());location.replace(url.href)};
  notice.append(title,button);document.body.append(notice);
 }
 new MutationObserver(refresh).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
 refresh();
})();
