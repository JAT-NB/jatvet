let pendingInstall;
const button=document.getElementById('installApp');
const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();pendingInstall=event;if(!standalone())button.hidden=false;});
window.addEventListener('appinstalled',()=>{pendingInstall=null;button.hidden=true;});
const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(ios&&!standalone())button.hidden=false;
button.addEventListener('click',async()=>{if(pendingInstall){await pendingInstall.prompt();const result=await pendingInstall.userChoice;pendingInstall=null;button.hidden=true;}else if(ios){alert('Para instalar JAT Vet: abrí esta página en Safari, tocá Compartir y elegí “Agregar a pantalla de inicio”.');}});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
