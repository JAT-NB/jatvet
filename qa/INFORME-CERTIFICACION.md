# Certificación QA JAT Vet 4.0.1 — 21/10/2026

**Veredicto: NO APTO PARA COMERCIALIZACIÓN por certificación incompleta.** No afirma una vulnerabilidad explotada: faltan comprobaciones críticas de seguridad, integridad y dispositivos.

Base auditada: `f7a40a3aebbd9433cb248814c4716feb9615a91a` (HEAD del PR #19 comprobado con Git). Rama exclusiva `qa/certificacion-2026-10-21`. Chromium 154.0.8037.57; Node 24.19.0; Playwright 1.58.2; Firebase CLI 15.14.0; emulador Authentication, proyecto `demo-jatvet-qa`.

## Resultado de esta ejecución

- Casos planificados en matriz: 81.
- Ejecutados: 61; PASS: 60; FAIL: 1.
- BLOQUEADOS: 20; PENDIENTES no ejecutados: 0.
- REG-01 cuenta como un caso con ocho aserciones estáticas, separado de la ejecución funcional.
- Los 20 PASS manuales anteriores y la prueba 21 inconclusa son antecedentes del usuario, no resultados automatizados de esta ejecución.

## Alcance real y evidencia

`resultados/matriz.csv` enumera todos los casos y estados. `resultados/ejecucion.json` conserva resultados del editor, login y PWA; `resultados/auth-emulador.json` conserva resultados Authentication y cuentas ficticias; `resultados/regresion-estatica.txt` registra el test existente. Hay capturas desktop, móvil y login y un JSON exportado ficticio.

El runner funcional ejecuta el adaptador S y editor reales del bundle sin modificarlo. Las secciones se seleccionan mediante la función de navegación del editor; los formularios, botones, fotos y descarga se manejan con Playwright. El guardado se captura en memoria del padre, **no** Firestore. La restauración aditiva se comprueba mediante helpers reales exportados, no mediante el panel autenticado. La foto se comprueba en el editor y mensaje de guardado, no después de recargar desde backend. La prueba de claim admin solo acredita Authentication en un proyecto demo, no privilegios efectivos de la aplicación.

Se verificaron alta y edición de paciente y servicio, campos obligatorios, turnos con referencias, superposición a 0 y 29 minutos, aceptación a 30 minutos, ingreso por turno realizado sin duplicación, ingresos/egresos y balance, exportación, mezcla aditiva y rechazos de respaldos inválidos, aislamiento sandbox y escape de texto malicioso, fotos agregar/quitar, render de once secciones, login, contraseña visible, correo recordado, manifest y registro SW. Authentication verificó login, logout, contraseña inválida, cuenta deshabilitada, código local de recuperación y claim admin.

La comprobación de errores JS cubre el editor en ese recorrido; no certifica toda la aplicación. Solo se usó Chromium con viewport móvil, sin equivalencia a Safari o dispositivos físicos.

## Hallazgos y riesgos

1. **Media — PWA-03 FAIL reproducido:** navegar/recargar sin conexión no entrega una página utilizable. `v4/sw.js` devuelve `Response.error()` si fetch falla. Impacto: sin acceso offline al iniciar/recargar; no se demuestra pérdida de datos. Es un comportamiento deliberado del SW actual que incumple el caso offline, no un fallo de instalación.
2. **Alta — validación de seguridad bloqueada:** no hay reglas Firestore, fuentes ni configuración de emulador Firestore en el checkout. No se acredita aislamiento A/B, perfiles, suscripciones ni getAfter/chunks. No se crearon reglas sustitutas que producirían falsa confianza.
3. **Alta — riesgo de herramientas QA:** `verifyAccess` usa una URL Firestore remota fija incluso con `?emulators=1`. No iniciar sesiones reales en pruebas locales. Los navegadores de estos runners abortan destinos externos; el runner Auth usa exclusivamente el emulador local demo. Integrar verificación de perfiles con Firestore emulado requiere una tarea de código separada y autorización.
4. **Alta — garantías de datos aún no acreditadas:** concurrencia, persistencia en backend, restauración integral y cambio entre usuarios siguen bloqueados.
5. **Media — cobertura limitada al editor:** se completaron eliminación protegida de paciente, eliminación de servicio sin relaciones, edición/eliminación de turno, corrección de realizado con reversión de ingreso y auditoría, CRUD de vacunas con caja y reportes por día/mes/histórico. La persistencia tras recarga desde backend sigue bloqueada.

## Reproducción y preparación del entorno

Dependencias fuera del checkout en `/workspace/qa-tools`. Servidor estático verificado con GET local y etiqueta 4.0.1. Emulador Auth iniciado y listo en 127.0.0.1:9199. El servidor estático utiliza puerto 8000 y los runners 8765/8766. No hay compilación disponible: este repositorio contiene artefactos web.

```sh
cd /workspace/jatvet
NODE_PATH=/workspace/qa-tools/node_modules node qa/certificacion.cjs
# Retorna 1 por PWA-03, no ocultar ese resultado.
NODE_PATH=/workspace/qa-tools/node_modules node qa/auth-emulador.cjs
node tests/actualizacion-silenciosa.cjs
```

Antes del runner Auth, desde `/workspace/qa-tools`:

```sh
XDG_CONFIG_HOME=/workspace/qa-tools/config FIREBASE_CLI_DISABLE_TELEMETRY=1 ./node_modules/.bin/firebase emulators:start --only auth --project demo-jatvet-qa --config /workspace/jatvet/qa/firebase.json
```

El runner Auth reinicializa únicamente las cuentas del proyecto demo en el emulador local. Las credenciales ficticias son fixtures, no credenciales reales. El emulador no envía correos. Las salidas se reemplazan en cada ejecución. No hay cambios en archivos productivos, reglas, datos remotos, despliegues ni merges.

Se guardaron `install_script` y `start_skill` en el borrador del entorno. Guardar el borrador no publica ni ejecuta esos campos: revisar y guardar en configuración del entorno, luego publicar. No se verificó restauración en una tarea nueva.

## Acciones priorizadas

1. Aportar exportación de reglas Firestore efectivas y preparar conexión de perfiles totalmente emulada; ejecutar aislamiento, perfiles, vencimientos y prueba 21 getAfter con identidades ficticias.
2. Completar recorridos de integridad, concurrencia, restauración y persistencia con backend indicados como bloqueados en matriz antes de certificar.
3. Definir requisito offline y corregirlo en tarea separada si se exige funcionamiento sin red.
4. Validar instalación/actualización en Android e iOS y correspondencia con la versión desplegada sin alterar datos reales.

## PR #19

La API GitHub devolvió `Forbidden` tanto por GraphQL como REST al leer el PR. La rama QA y su correspondencia con refs/pull/19/head sí fueron verificadas con Git. El resumen listo para el PR se conserva en `qa/RESUMEN-PR-19.md`. La publicación de cambios por Git se documenta en el cierre de esta tarea; no se afirma que un comentario API haya sido enviado.
