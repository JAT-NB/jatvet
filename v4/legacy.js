import legacy from '../index.html?raw';
// The legacy document is rendered only with an in-memory copy. It never reads localStorage.
export function mountLegacy(container,data,onSave){
 const frame=document.createElement('iframe');frame.title='Espacio veterinario';
 frame.setAttribute('sandbox','allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads');
 const replacements={
  "let db=load()":"let db=window.__v4data",
  "function save(){localStorage.setItem(KEY,JSON.stringify(db))}":"function save(){window.__v4save(structuredClone(db))}",
  "syncAllTurnIncome();document.getElementById('closePreview')":"document.getElementById('closePreview')"
 };
 let html=legacy;
 for(const [from,to] of Object.entries(replacements)){if(!html.includes(from))throw Error('El adaptador requiere revisión: cambió el código anterior.');html=html.replace(from,to);}
 // Replace ALL storage access, including display-name preference, with isolated memory.
 html=html.replaceAll('localStorage','window.__v4memory');
 html=html.replaceAll('${x.photo}', '${esc(x.photo)}').replaceAll('${p.photo}', '${esc(p.photo)}');
 html=html.replace(/<link rel="manifest"[^>]*>/,'');
 html=html.replace(/if\('serviceWorker'in navigator&&location.protocol.startsWith\('http'\)\)navigator.serviceWorker.register\('\.\/sw.js'\).catch\(\(\)=>\{\}\);/,'');
 // Imports must go through the reviewed migration flow in the outer shell.
 html=html.replace("if(e.target.id!=='import')return;","if(e.target.id==='import'){alert('Usá Importar respaldo anterior en JAT Vet 4.0 para revisar y agregar datos sin reemplazarlos.');e.target.value='';return}if(e.target.id!=='import')return;");
 html=html.replace('V3.9 · Servicios y costos','V4.0 · Espacio Firebase');
 html=html.replace('Modo demostración sin login. Los datos se guardan solamente en este navegador; no hay sincronización ni acceso multiusuario. No cargues datos sensibles reales.','Versión de prueba Firebase. Revisá el estado de sincronización antes de cerrar.');
 html=html.replace('La importación reemplaza los datos actuales.','Para importar sin reemplazar datos usá el panel Importar respaldo anterior de JAT Vet 4.0.');
 html=html.replace('No hay sincronización entre dispositivos ni cuentas de usuario en esta versión. El almacenamiento local puede perderse si se borran los datos del navegador.','La cuenta y el estado de guardado se muestran en JAT Vet 4.0. Conservá respaldos y recargá el espacio cuando se anuncien cambios de otro dispositivo.');
 const token=crypto.randomUUID();
 const serialized=JSON.stringify(data).replaceAll('<','\\u003c');
 const bootstrap='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data: blob:; frame-src data: blob:; form-action \'none\'; connect-src \'none\'"><script>window.__v4data='+serialized+';window.__v4save=data=>parent.postMessage({type:"jat-v4-save",token:'+JSON.stringify(token)+',data},"*");window.__v4memory={getItem:()=>null,setItem:()=>{}};<\/script>';
 const handler=event=>{if(event.source===frame.contentWindow && event.data?.type==='jat-v4-save' && event.data.token===token)onSave(event.data.data);};
 // Remove the previous frame listener; callbacks cannot survive workspace changes.
 container.__disposeLegacy?.();
 window.addEventListener('message',handler);
 container.__disposeLegacy=()=>window.removeEventListener('message',handler);
 frame.srcdoc=html.replace('<head>','<head>'+bootstrap);container.replaceChildren(frame);return frame;
}
