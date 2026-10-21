let pendingInstall;
const button=document.getElementById('installApp');
const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();pendingInstall=event;if(!standalone())button.hidden=false;});
window.addEventListener('appinstalled',()=>{pendingInstall=null;button.hidden=true;});
const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(ios&&!standalone())button.hidden=false;
button.addEventListener('click',async()=>{if(pendingInstall){await pendingInstall.prompt();const result=await pendingInstall.userChoice;pendingInstall=null;button.hidden=true;}else if(ios){alert('Para instalar JAT Vet: abrí esta página en Safari, tocá Compartir y elegí “Agregar a pantalla de inicio”.');}});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});

/* Verifica nuevas versiones sin interrumpir el trabajo del usuario. */
(() => {
  const runningVersion = '4.0.0'; // Debe coincidir con version.json de la publicación
  let dismissedVersion = '';
  const notice = document.createElement('aside');
  notice.setAttribute('role','status');
  notice.style.cssText='display:none;position:fixed;bottom:16px;left:16px;right:16px;max-width:430px;margin:auto;z-index:2147483647;background:white;color:#123b50;padding:16px;border:1px solid #cbdce3;border-radius:12px;box-shadow:0 8px 24px #0003;font:14px system-ui';
  const description=document.createElement('p');
  const update=document.createElement('button');
  update.textContent='Actualizar ahora';
  update.type='button';
  update.style.cssText='padding:10px;margin-right:8px;background:#123b50;color:white;border:0;border-radius:8px';
  const later=document.createElement('button');
  later.textContent='Más tarde';
  later.type='button';
  later.style.cssText='padding:10px;border:0;border-radius:8px';
  notice.append(description,update,later);
  const mount=()=>{if(!notice.isConnected)document.body.append(notice);};
  let availableVersion='';
  later.addEventListener('click',()=>{dismissedVersion=availableVersion;notice.style.display='none';});
  update.addEventListener('click',async()=>{
    update.disabled=true;
    update.textContent='Verificando actualización…';
    try{
      // No mostrar un falso éxito si la nueva publicación aún no está disponible.
      const entry=await fetch('/jatvet/?comprobar='+Date.now(),{cache:'no-store'});
      if(!entry.ok)throw Error('No se pudo consultar la nueva publicación');
      const html=await entry.text();
      const installer=html.match(/<script[^>]+src=["']([^"']*\/install\.js[^"']*)["']/);
      if(!installer)throw Error('La publicación no incluye el instalador');
      const script=await fetch(new URL(installer[1],location.origin),{cache:'no-store'});
      if(!script.ok)throw Error('No se pudo consultar el instalador nuevo');
      const source=await script.text();
      const version=source.match(/const runningVersion\s*=\s*['"]([^'"]+)['"]/);
      if(!version||version[1]!==availableVersion)throw Error('La nueva versión todavía no está publicada completamente');
      if('serviceWorker' in navigator){
        const registration=await navigator.serviceWorker.getRegistration('/jatvet/');
        if(registration)await registration.update();
      }
      const url=new URL(location.href);
      url.searchParams.delete('jatvet_prueba_actualizacion');
      url.searchParams.set('actualizado',String(Date.now()));
      location.replace(url.href);
    }catch(err){
      description.textContent='No se pudo confirmar la actualización. Tus datos no se modificaron. Probá más tarde.';
      update.disabled=false;
      update.textContent='Reintentar';
      console.warn('JAT Vet: actualización no confirmada',err);
    }
  });
  async function check(){
    if(document.hidden)return;
    try{
      const response=await fetch('/jatvet/version.json?check='+Date.now(),{cache:'no-store'});
      if(!response.ok)return;
      const info=await response.json();
      if(!info||typeof info.version!=='string'||!/^\d+\.\d+\.\d+$/.test(info.version))return;
      if(info.version===runningVersion||info.version===dismissedVersion){notice.style.display='none';return;}
      availableVersion=info.version;
      mount();
      description.textContent='JAT Vet '+info.version+' disponible. Guardá los cambios antes de actualizar.';
      notice.style.display='block';
    }catch(_){/* sin red, no interrumpir */}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',check,{once:true});else check();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
  window.addEventListener('focus',check);
  setInterval(check,15*60*1000);
})();
