export const PROJECT_ID='jat-vet-pruebas';
export const EXPECTED_CONFIG=Object.freeze({
 apiKey:'AIzaSyBsdw3MfmtfXn3aCcCV6_IQzX6v3Qw7Yvs',
 authDomain:'jat-vet-pruebas.firebaseapp.com',projectId:PROJECT_ID,
 storageBucket:'jat-vet-pruebas.firebasestorage.app',messagingSenderId:'687038553989',
 appId:'1:687038553989:web:a34c236cb368fd44d92eec'
});
export function validateConfig(config){
 if(!config||Object.entries(EXPECTED_CONFIG).some(([key,value])=>config[key]!==value))throw Error('Entorno bloqueado: esta V4 acepta exclusivamente la aplicación registrada en jat-vet-pruebas.');
 return Object.fromEntries(Object.keys(EXPECTED_CONFIG).map(key=>[key,config[key]]));
}
export function hasAdminClaim(claims){return claims?.aud===PROJECT_ID && claims?.jatvetAdmin===true;}
