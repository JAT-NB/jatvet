import { readFileSync, existsSync } from 'node:fs';
const read = path => readFileSync(path, 'utf8');
const js = read('install.js');
const index = read('index.html');
const manifest = JSON.parse(read('manifest.webmanifest'));
const published = JSON.parse(read('version.json')).version;
const running = js.match(/const runningVersion\s*=\s*['"]([^'"]+)['"]/);
const errors = [];
if (!running) errors.push('install.js no declara runningVersion');
if (!/^\d+\.\d+\.\d+$/.test(published)) errors.push('version.json no contiene versión semántica');
if (running && running[1] !== published) errors.push('runningVersion y version.json no coinciden');
if (!index.includes('/jatvet/install.js')) errors.push('index.html no carga install.js');
if (!index.includes('/jatvet/manifest.webmanifest')) errors.push('index.html no carga el manifest');
if (manifest.scope !== '/jatvet/' || manifest.start_url !== '/jatvet/') errors.push('La PWA no usa la URL definitiva');
for (const path of ['sw.js','firebase-config.json']) if (!existsSync(path)) errors.push('Falta '+path);
if (!js.includes("cache:'no-store'")) errors.push('La consulta de versión debe evitar caché');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('JAT Vet: versión '+published+' y rutas principales verificadas.');
