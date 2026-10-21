# Certificación QA JAT Vet 4.0.1 — continuación del 21/10/2026

**Veredicto: NO APTO PARA COMERCIALIZACIÓN.** Hay fallos reproducidos de vencimiento de suscripciones y recuperación de cambios pendientes, además del requisito de funcionamiento offline y cuatro verificaciones externas bloqueadas.

## Resultado

| Alcance | Planificados | Ejecutados | PASS | FAIL | BLOQUEADOS |
|---|---:|---:|---:|---:|---:|
| 81 casos originales | 81 | 77 | 74 | 3 | 4 |
| Cuatro casos complementarios nuevos | 4 | 4 | 3 | 1 | 0 |
| **Total actual** | **85** | **81** | **77** | **4** | **4** |

De los 20 bloqueos iniciales se resolvieron 16: 14 PASS y dos FAIL. Se añadieron OFFLINE-UX-01, OFFLINE-SEC-01, OFFLINE-REC-01 y DATA-04-REVOKE. Cada ID cuenta una sola vez aunque tenga comprobaciones Node y navegador. REG-01 es un caso con ocho aserciones estáticas. No se contabilizan ejecuciones de preparación fallidas ni pruebas omitidas como PASS.

Los 20 resultados manuales anteriores y la prueba 21 inconclusa son antecedentes del propietario, no ejecución propia. El informe anterior se conserva en Git (`eeb2225`).

## Base, reglas e infraestructura

- Rama exclusiva `qa/certificacion-2026-10-21`; aplicación compilada de `eeb22256f5fc99d56fe1a775b2bf7b5d8dbea06d`. No se cambió código productivo, main, reglas remotas ni datos reales; no hubo merge ni despliegue.
- Se inspeccionaron todas las ramas e historia disponibles. En desarrollo-v4-firebase se encontraron reglas y fuentes, pero el propietario confirmó que las reglas históricas no coincidían con las desplegadas. **No se usaron para la certificación final.**
- Reglas de referencia: texto completo copiado por el propietario desde Firestore → Reglas de jat-vet-pruebas, guardado sin cambios de lógica en `qa/firestore/firestore.rules`. SHA-256: `6dac84f09a73458c96e56afc93f1ef20c14614f20e3836cc259a255fe1733cba`. Procedencia en `qa/firestore/PROCEDENCIA.json`. No se afirma lectura administrativa independiente del despliegue.
- Firestore Emulator 1.22.0 en 127.0.0.1:8180; Authentication separado en 127.0.0.1:9299, proyecto local jat-vet-pruebas para que la audiencia de tokens coincida con las reglas. También se repitió Auth original con proyecto demo en 9199. El nombre del proyecto en un emulador no implica acceso remoto.
- La descarga Firebase CLI falló por HTTP 403 en storage.googleapis.com. Se obtuvo el emulador desde la imagen oficial Google Cloud CLI en el registro permitido gcr.io, fijada por digest; se verificaron capas y SHA-256 del JAR. No se desactivó TLS ni se alteraron checksums del CLI. Imagen, versión y hash constan en PROCEDENCIA.json y en el script reproducible.
- Node 24.19.0, Java 21, Firebase SDK 12.4.0, rules-unit-testing 5.0.0, Playwright 1.58.2 y Chromium del entorno. Dependencias y emulador conservados fuera del checkout, en /workspace/qa-tools.
- Node usa las fuentes reales repository/data recuperadas, con cambios de loader e import para compartir el SDK del runner. El navegador usa los bundles actuales de la aplicación, sin alterar su lógica.

## Comprobaciones ejecutadas

**Seguridad:** lecturas/escrituras A/B y anónimo denegadas por permission-denied; un error de red no cuenta como denegación aprobada. Protección de perfiles propios y ajenos, administración por claim, rechazo de campos no admitidos y borrados de perfil. Perfil habilitado permitido; suspendido y ausente denegados. Esquema de manifiestos, identidad del actor, revisión y límites de count verificados.

**Prueba 21 / SEC-07:** guardado multichunk con Unicode, lectura íntegra, negativa de escritura directa de chunks sin actualizar manifiesto, rechazo de revisión obsoleta y reducción a respaldo vacío. La transacción válida con getAfter() pasó. Los errores de reglas en las pruebas negativas del log son denegaciones esperadas comprobadas por código, no PASS inferidos de texto del simulador.

**Persistencia y concurrencia:** alta por formulario, confirmación Firestore y recarga; reapertura desde otro cliente; dos escrituras con la misma revisión producen exactamente una ganadora y una rechazada; listener recibe la revisión y se compara el contenido con el ganador. La denegación del perdedor puede ser permission-denied en el emulador, no siempre el mensaje amistoso de revisión obsoleta. Se acredita integridad, no resolución completa de esa UX.

**Backup y fotos:** importación revisada autenticada, confirmación del titular y descarga de copia previa; comparación de registros, fotos, adjuntos y totales tras recarga. Restauración aditiva, reimportación sin duplicados y reversión al respaldo previo desde el repositorio. Cambio de foto mediante selector real y comparación después de recargar. Cambio A/B sin fichas del otro usuario ni datos clínicos en localStorage.

**Regresión:** pacientes, servicios, turnos, caja, vacunas, informes, respaldos, login, sandbox y PWA; seis pruebas Auth y test estático existente. Se ejecutaron además desconexión prolongada durante guardado y revocación inmediata del perfil. La recuperación de contraseña solo generó códigos locales; no se enviaron correos.

## Fallos reproducidos

| ID | Severidad | Resultado observado | Evidencia bajo qa/resultados/continuacion/ |
|---|---|---|---|
| SEC-05 | Alta | Perfil enabled=true con expiry="2000-01-01" puede leer y escribir. access(uid) no comprueba el vencimiento. | expiry-evidence.json, firestore.json |
| DATA-04 | Alta | Tras 13 segundos sin red durante guardado, la revalidación limpia editor y copia pendiente. La revisión confirmada durante la desconexión sigue en 3, igual que antes. | network-evidence.json, DATA-04-fail.png, navegador-integrado.json |
| DATA-04-REVOKE | Alta | Si el perfil se suspende antes del guardado, se promete conservar la copia pendiente pero el botón de descarga queda oculto. | DATA-04-REVOKE-fail.png, navegador-integrado.json |
| PWA-03 | Media | Recargar sin red no permite usar la aplicación veterinaria: devuelve pantalla HTTP 503. | offline.json, offline-503.png |

DATA-04 y DATA-04-REVOKE son dos escenarios del mismo problema de recuperación. No se demuestra pérdida de registros previamente confirmados; sí falla la disponibilidad prometida de la copia de cambios no confirmados.

**Corrección del diagnóstico offline anterior:** el SW actual ya tiene pantalla Sin conexión; no devuelve Response.error() como decía el mensaje del runner anterior. La pantalla, Cache-Control: no-store, ausencia de fichas/caché clínica y Reintentar al recuperar Internet dieron PASS. PWA-03 sigue FAIL porque exige aplicación utilizable al recargar sin red. No se redefinió el criterio para hacerlo pasar ni se modificó v4/sw.js.

Propuestas sin implementación productiva: `qa/PROPUESTA-CORRECCIONES.md`. Incluyen vencimiento en servidor, recuperación segura de pendientes por UID y separación de errores transitorios frente a revocación; trabajo de diseño separado si se exige operación clínica offline.

## Cuatro bloqueos restantes

| Caso | Requisito exacto |
|---|---|
| PWA-04 | Android e iOS reales o servicio de dispositivos que permita instalar/verificar la PWA. Viewport Chromium no sustituye esos dispositivos. |
| PWA-05 | Dispositivos con versión previa instalada y versión destino autorizada en QA para verificar actualización/migración. No se desplegó producción. |
| OPS-01 | Permitir GET HTTPS a jat-nb.github.io en la red efectiva para comparar HTML y bundles públicos. El proxy devolvió CONNECT 403; el borrador incluye el dominio pero la instancia aún no lo permite. |
| AUTH-REAL-01 | Entrega de correo real prohibida por alcance. Requeriría buzón exclusivo QA y autorización específica de envío; no se solicita contraseña real. El código emulado sí fue verificado. |

No faltan credenciales de veterinarios para estas pruebas emuladas. El texto actual de reglas permitió validarlas sin permisos administrativos de producción.

## Evidencias y reproducción

Matriz completa con rutas de evidencia: `qa/resultados/matriz.csv`; resumen: `qa/casos-certificacion.csv`. Totales: `qa/resultados/continuacion/resumen.json`. JSON, logs, descargas y capturas contienen únicamente datos ficticios. Se eliminaron capturas de fallos de preparación superados; no se presentaron como defectos de aplicación.

```sh
bash /workspace/jatvet/qa/preparar-entorno.sh
```

Arrancar en procesos separados y esperar API endpoint y All emulators ready:

```sh
bash /workspace/qa-tools/firestore-official/cloud_firestore_emulator --host 127.0.0.1 --port 8180 --project_id jat-vet-pruebas --single_project_mode true --single_project_mode_error true --rules /workspace/jatvet/qa/firestore/firestore.rules
cd /workspace/qa-tools
XDG_CONFIG_HOME=/workspace/qa-tools/config FIREBASE_CLI_DISABLE_TELEMETRY=1 ./node_modules/.bin/firebase emulators:start --only auth --project jat-vet-pruebas --config /workspace/jatvet/qa/firestore/firebase.json
```

Ejecutar secuencialmente desde /workspace/jatvet:

```sh
NODE_PATH=/workspace/qa-tools/node_modules node qa/firestore/integracion.cjs
NODE_PATH=/workspace/qa-tools/node_modules node qa/firestore/navegador.cjs
NODE_PATH=/workspace/qa-tools/node_modules node qa/offline.cjs
NODE_PATH=/workspace/qa-tools/node_modules node qa/certificacion.cjs
node tests/actualizacion-silenciosa.cjs
```

El runner de reglas limpia exclusivamente Firestore local del proyecto emulado; no ejecutarlo junto al navegador. Retornan 1 por fallos conocidos, 2 por preparación bloqueada y 0 solo sin fallos. Auth original (qa/auth-emulador.cjs) requiere el emulador demo de qa/firebase.json en 9199, independiente del integrado en 9299. Los runners reemplazan sus resultados; conservar esta versión en Git antes de repetir.

El navegador integrado sirve en 8768, bloquea destinos externos y redirige solo Auth 9199→9299 y verificación REST de perfiles ficticios hacia 8180. Esa adaptación del test es necesaria por la URL REST remota fija que usa la aplicación incluso en modo emulador. No iniciar sesiones reales en ese servidor. Offline y editor usan 8767 y 8765; no hay previews públicos.

Se prepararon instrucciones reutilizables de instalación/arranque. Guardar el borrador no publica la aplicación ni demuestra restauración en otra tarea. No se modificaron datos de Verónica ni de ningún otro veterinario.

## Qué falta para comercializar

Corregir y repetir vencimientos y recuperación segura de pendientes; resolver el requisito offline sin rebajar el caso existente; completar los cuatro bloqueos externos. Repetir seguridad e integridad contra la versión final aprobada. Las pruebas aprobadas de aislamiento y persistencia no bastan para certificar con los fallos actuales.
