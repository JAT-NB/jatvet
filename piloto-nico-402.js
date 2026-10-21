(()=>{
const KEY='jatvet-nico-402', EMAIL='nbargiola@hotmail.com';
let displayed=false;
const verify=()=>{
 if(displayed||localStorage.getItem(KEY)==='yes')return;
 const identity=document.getElementById('identity');
 if((identity?.textContent||'').trim().toLowerCase()!==EMAIL)return;
 displayed=true;
 const notice=document.createElement('aside');
 notice.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;max-width:410px;margin:auto;background:#fff;color:#123b50;padding:16px;border-radius:12px;border:1px solid #aac;box-shadow:0 8px 22px #0003;z-index:2147483647;font:14px system-ui';
 const title=document.createElement('p');
 title.textContent='JAT Vet 4.0.2: actualización visual disponible';
 const action=document.createElement('button');
 action.textContent='Actualizar ahora';
 action.style.cssText='background:#123b50;color:white;padding:10px;border:0;border-radius:8px';
 action.onclick=()=>{localStorage.setItem(KEY,'yes');location.reload()};
 notice.append(title,action);document.body.append(notice);
};
new MutationObserver(verify).observe(document.documentElement,{subtree:true,childList:true,characterData:true});verify();
})();