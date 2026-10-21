export const COLLECTIONS=['pets','turns','procedures','services','money','studies','vaccinations','audit'];
export function emptyData(){return Object.fromEntries(COLLECTIONS.map(k=>[k,[]]));}
export function validateBackup(input){
 if(!input || typeof input!=='object' || Array.isArray(input))throw Error('El respaldo debe ser un objeto JSON.');
 const data=structuredClone(input);
 for(const kind of COLLECTIONS){
  if(data[kind]===undefined){if(['pets','turns','procedures','services','money'].includes(kind))throw Error('Falta la colección '+kind);data[kind]=[];}
  if(!Array.isArray(data[kind]))throw Error('Colección inválida: '+kind);
  const ids=new Set();
  for(const r of data[kind]){if(!r || typeof r!=='object' || typeof r.id!=='string' || !r.id || ids.has(r.id))throw Error('ID ausente o duplicado en '+kind);ids.add(r.id);}
 }
 for(const kind of ['turns','procedures','money','studies','vaccinations'])for(const r of data[kind]){
  if(r.petId && !data.pets.some(p=>p.id===r.petId))throw Error('Referencia a paciente inexistente: '+r.petId);
  if(r.serviceId && !data.services.some(p=>p.id===r.serviceId))throw Error('Referencia a servicio inexistente: '+r.serviceId);
 }
 for(const r of data.studies)if(r.file && !/^data:(image\/(jpeg|png|gif|webp|bmp|avif|heic|heif)|application\/pdf);base64,[A-Za-z0-9+/=\r\n]+$/.test(r.file))throw Error('Adjunto no compatible o inseguro: '+r.id);
 for(const r of data.money)if(!Number.isFinite(Number(r.amount)) || Number(r.amount)<0 || !['Ingreso','Gasto'].includes(r.kind))throw Error('Movimiento de caja inválido.');
 return data;
}
function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value && typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));return value;}
export function same(a,b){return JSON.stringify(canonical(a))===JSON.stringify(canonical(b));}
export function totals(data){return {counts:Object.fromEntries(COLLECTIONS.map(k=>[k,data[k]?.length||0])),income:data.money.filter(r=>r.kind==='Ingreso').reduce((n,r)=>n+Number(r.amount),0),expense:data.money.filter(r=>r.kind==='Gasto').reduce((n,r)=>n+Number(r.amount),0),photos:data.pets.filter(r=>r.photo).length,attachments:data.studies.filter(r=>r.file).length};}
export function mergeBackup(current,backup){
 current=validateBackup(current);backup=validateBackup(backup);const result=structuredClone(current);let duplicates=0;
 for(const k of COLLECTIONS)for(const r of backup[k]){const old=result[k].find(x=>x.id===r.id);if(old){if(!same(old,r))throw Error('Conflicto en '+k+' / '+r.id+'. No se sobrescribió ningún dato.');duplicates++;}else result[k].push(r);}
 for(const k of Object.keys(backup).filter(k=>!COLLECTIONS.includes(k))){if(k in result && !same(result[k],backup[k]))throw Error('Conflicto en metadatos: '+k);result[k]=backup[k];}
 return {data:result,duplicates,before:totals(current),source:totals(backup),after:totals(result)};
}
// 100,000 UTF-16 units <= 400,000 UTF-8 bytes, below Firestore's document limit.
export function encode(data){const json=JSON.stringify(data);if(new TextEncoder().encode(json).length>4*1024*1024)throw Error('El espacio supera el límite seguro de 4 MB de este piloto. No se guardó ningún cambio; conservá el respaldo.');const chunks=[];for(let i=0;i<json.length;){let end=Math.min(i+100000,json.length);const code=json.charCodeAt(end-1);if(end<json.length && code>=0xD800 && code<=0xDBFF)end--;chunks.push(json.slice(i,end));i=end;}if(chunks.length>390)throw Error('Respaldo demasiado grande para una transacción. No se guardó ningún cambio.');return chunks;}
export function decode(chunks){return validateBackup(JSON.parse(chunks.join('')));}
