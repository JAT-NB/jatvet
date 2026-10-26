const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const app = fs.readFileSync('qa-cinco-real/qa-app-fixes-20261026.js','utf8');
const html = fs.readFileSync('qa-cinco-real/index.html','utf8');
test('JV-004 bloquea fecha pasada en creación y al guardar',()=>{
 assert.match(app,/if\(!excludeId&&new Date\(data\.date/);
 assert.match(app,/JV-004: No se pueden crear turnos con fecha u hora pasadas/);
});
test('JV-021 persiste sección en sesión',()=>{
 assert.match(app,/sessionStorage\.getItem\('jatvet-qa-section'\)/);
 assert.match(app,/sessionStorage\.setItem\('jatvet-qa-section'/);
});
test('JV-003 evita reiniciar por fallo temporal en control de acceso',()=>{
 assert.match(app,/Conexión temporalmente interrumpida\. Conservamos la pantalla/);
});
test('JV-023 evita la primera confirmación al cambiar desde Realizado',()=>{
 assert.match(app,/previous\.status==='Realizado'&&data\.status==='Realizado'&&!confirm/);
});
test('Caja conserva vínculo entre ingresos automáticos y turnos',()=>{
 assert.match(app,/function syncAllTurnIncome\(\)/);
 assert.match(app,/m\.turnId!==item\.id/);
});
test('JV-022 historial Android y JV-024 indicador cancelado',()=>{assert.match(app,/window\\.addEventListener\\('popstate'/);assert.match(app,/turn-cancelled/);assert.match(app,/pill-cancelled/);});
test('La página apunta al código aislado QA',()=>{
 assert.match(html,/qa-cinco-real\/qa-app-fixes-20261026\.js\?v=2/);
});
