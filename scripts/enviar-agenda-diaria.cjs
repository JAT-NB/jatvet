// Agenda diaria de JAT Vet. Requiere secretos privados en GitHub Actions.
// No imprime nombres, teléfonos ni direcciones en los logs.
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { DateTimeFormat } = Intl;
const required = ['FIREBASE_SERVICE_ACCOUNT_JSON','SMTP_HOST','SMTP_USER','SMTP_PASS','SMTP_FROM'];
for (const key of required) if (!process.env[key]) throw new Error('Falta configurar el secreto '+key);
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))});
const db=admin.firestore();
const recipient=process.env.AGENDA_DESTINATARIO||'vbaraggiola@hotmail.com';
const date=new Date().toLocaleDateString('en-CA',{timeZone:'America/Argentina/Buenos_Aires'});
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function main(){
 const user=await admin.auth().getUserByEmail(recipient);
 const profile=await db.collection('profiles').doc(user.uid).get();
 if(!profile.exists||profile.data().enabled!==true) {console.log('Perfil no habilitado; no se envía correo.');return;}
 const manifest=await db.collection('workspaces').doc(user.uid).get();
 if(!manifest.exists){console.log('Agenda vacía.');return;}
 const count=manifest.data().count;
 if(!Number.isInteger(count)||count<1||count>390)throw Error('Manifiesto de datos inválido');
 const chunks=await Promise.all(Array.from({length:count},(_,i)=>db.collection('workspaces').doc(user.uid).collection('chunks').doc(String(i)).get()));
 if(chunks.some(c=>!c.exists))throw Error('Datos incompletos; correo cancelado');
 const data=JSON.parse(chunks.map(c=>c.data().payload).join(''));
 const turns=(data.turns||[]).filter(t=>t.date===date&&['Pendiente','Confirmado'].includes(t.status)).sort((a,b)=>String(a.time).localeCompare(String(b.time)));
 if(!turns.length){console.log('Sin turnos; no se envía correo.');return;}
 const pets=new Map((data.pets||[]).map(p=>[p.id,p]));
 const services=new Map((data.services||[]).map(s=>[s.id,s.name]));
 const lines=turns.map(t=>{const p=pets.get(t.petId)||{};return [t.time+' — '+(p.pet||'Paciente'),services.get(t.serviceId)||'Consulta','Responsable: '+(p.owner||'Sin registrar'),'Dirección: '+(p.address||'Sin registrar'),'Teléfono: '+(p.phone||'Sin registrar')].join('\n');});
 const body='Buen día, Vero. 🐾\n\nHoy tenés '+turns.length+' turno(s) agendado(s):\n\n'+lines.join('\n\n')+'\n\nJAT Vet';
 // Marca previa para evitar correos duplicados si se reejecuta el workflow.
 const sentRef=db.collection('agendaMailDispatch').doc(user.uid+'_'+date);
 const shouldSend=await db.runTransaction(async tx=>{const d=await tx.get(sentRef);if(d.exists)return false;tx.create(sentRef,{recipient,date,createdAt:admin.firestore.FieldValue.serverTimestamp(),status:'processing'});return true;});
 if(!shouldSend){console.log('Resumen del día ya procesado.');return;}
 try{
  const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||465),secure:Number(process.env.SMTP_PORT||465)===465,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
  await transport.sendMail({from:process.env.SMTP_FROM,to:recipient,subject:'JAT Vet — Agenda del '+date,text:body});
  await sentRef.update({status:'sent',sentAt:admin.firestore.FieldValue.serverTimestamp()});
  console.log('Correo enviado correctamente.');
 }catch(err){await sentRef.update({status:'failed',failedAt:admin.firestore.FieldValue.serverTimestamp()});throw err;}
}
main().catch(e=>{console.error('Error de envío:',e.message);process.exitCode=1;});
