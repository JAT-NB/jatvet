import {doc,runTransaction,onSnapshot} from 'firebase/firestore';
import {encode,decode,emptyData} from './data.js';
export function repository(db,uid){
 if(!uid || uid.includes('/'))throw Error('UID inválido');
 const root=doc(db,'workspaces',uid), chunk=i=>doc(db,'workspaces',uid,'chunks',String(i));
 return {
  async read(){return runTransaction(db,async tx=>{const snap=await tx.get(root);if(!snap.exists())return {revision:0,data:emptyData()};const {revision,count}=snap.data();if(!Number.isInteger(count)||count<1||count>390)throw Error('Manifiesto inválido');const chunks=await Promise.all(Array.from({length:count},(_,i)=>tx.get(chunk(i))));if(chunks.some(c=>!c.exists()))throw Error('Respaldo incompleto');return {revision,data:decode(chunks.map(c=>c.data().payload))};});},
  async save(data,expectedRevision,actor){const chunks=encode(data);return runTransaction(db,async tx=>{const snap=await tx.get(root);const current=snap.exists()?snap.data().revision:0;if(current!==expectedRevision)throw Error('Otro dispositivo modificó estos datos. Descargá tu copia pendiente y recargá antes de continuar.');const oldCount=snap.exists()?snap.data().count:0;chunks.forEach((payload,i)=>tx.set(chunk(i),{payload}));for(let i=chunks.length;i<oldCount;i++)tx.delete(chunk(i));tx.set(root,{revision:current+1,count:chunks.length,updatedBy:actor});return current+1;});},
  watch(next,error){return onSnapshot(root,s=>next(s.exists()?s.data().revision:0),error);}
 };
}
