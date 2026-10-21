# Correcciones QA JAT Vet 4.0.1 — 21/10/2026

**Correcciones listas para revisión. No desplegadas. La certificación comercial final sigue pendiente de cuatro verificaciones externas.**

Rama: `fix/qa-seguridad-recuperacion-2026-10-21`, creada desde `fd21f2eee0b02a8ee913338164ae557822af5007`. No hubo merge, cambios en main, publicación de reglas, despliegue ni acceso a datos reales.

## Resultado automatizado

| Alcance | Casos | PASS | FAIL | BLOQUEADOS |
|---|---:|---:|---:|---:|
| Matriz anterior, reevaluada con el criterio aprobado | 85 | 81 | 0 | 4 |
| Pruebas nuevas de fechas y recuperación | 24 | 24 | 0 | 0 |
| **Total actual** | **109** | **105** | **0** | **4** |

Se ejecutaron 105 IDs únicos. Hay comprobaciones repetidas por Node y navegador, que no aumentan el número de casos. REG-01 cuenta como un caso con ocho aserciones estáticas. Los cuatro bloqueos no se ejecutaron ni se convirtieron en PASS. Los antecedentes manuales del propietario no se contabilizan como ejecución propia.

Matriz con evidencias: `qa/resultados/matriz.csv`; vista resumida: `qa/casos-certificacion.csv`. Resultados actuales: `qa/resultados/correcciones/`. Se preservaron la matriz de 85 casos y el informe previos en `qa/historico/`, junto con las evidencias originales de fallos en `qa/resultados/continuacion/` y los JSON anteriores. El fallo anterior de PWA-03 no se borró.

## Código corregido

### SEC-05: vencimiento en servidor

`qa/firestore/firestore.proposed.rules` es una propuesta separada de la copia publicada aportada por el propietario (`qa/firestore/firestore.rules`, sin cambios). Firestore decide con `request.time`, no con el reloj o la interfaz del usuario.

La fecha ISO incluye todo el día argentino UTC-03: el límite exclusivo es la medianoche argentina siguiente, equivalente a las 03:00 UTC. Se conservan perfiles habilitados sin expiry o con string vacío. Fechas inválidas, tipos inválidos y perfiles suspendidos se deniegan. Un admin con perfil suspendido/vencido no accede ni puede reactivarse desde la app; se conserva el bootstrap previo por claim cuando no existe perfil administrativo.

Se ejecutaron 19 casos de fechas: sin campo, vacío, ayer, hoy, mañana, formatos inválidos, bisiestos, tipos incorrectos, mes/día inexistentes, suspensión y administradores suspendidos/vencidos. El helper exacto de la propuesta se comprobó en el emulador un nanosegundo antes del límite, exactamente en él y un nanosegundo después, mediante reglas temporales sin rutas clínicas. Se restauró la propuesta completa en finally. Los casos generales ejercen la propuesta completa y request.time real.

**No se publicaron reglas ni se modificó ningún perfil real.** Los hashes de referencia y propuesta figuran en `correcciones/manifest.json`.

### DATA-04 / DATA-04-REVOKE: recuperación por propietario

`v4/app-session.js` separa la copia pendiente de la limpieza del editor y de los cambios de autenticación. Mantiene snapshots por UID dentro de una closure privada; no guarda información clínica en localStorage ni sessionStorage. El adaptador existente del editor delega guardado, revisión e importación en ese módulo.

- Desconexión/timeout bloquean el editor; revocación confirmada bloquea el acceso sin borrar la copia del propietario.
- Se comprueba el acceso antes de guardar; las reglas vuelven a decidir en Firestore. Una cuenta revocada no puede escribir ni mediante SDK directo.
- Reintentar conexión no reproduce escrituras. Un reintento explícito de guardado exige confirmación y la misma revisión.
- Solo una confirmación exacta de datos/revisión guardados retira el snapshot como pendiente. Descargarlo o cerrar sesión no lo borra; el descarte requiere una acción explícita del propietario.
- El propietario puede autenticarse otra vez y recuperar su copia aun con el perfil revocado, sin rehabilitar permisos. B no recibe la copia de A.
- Las respuestas tardías se verifican contra generación de sesión y propietario; no se asocian a la nueva identidad.
- La edición administrativa usa merge para conservar expiry, email, application y plan existentes, en lugar de eliminarlos al cambiar enabled/label.

Se probaron cortes de más de 13 segundos, timeout de ocho segundos con navigator.onLine aún verdadero, revocación, cierre de sesión, recuperación por el mismo propietario, acceso B, conflicto con otra escritura y cambio de identidad durante un guardado en curso. Se descargaron y compararon los JSON completos de recuperación. Las descargas se conservan con nombres únicos por secuencia.

### PWA-03: requisito aprobado y ejecución nueva

El propietario confirmó que JAT Vet requiere Internet y no debe permitir trabajo clínico offline. El criterio actualizado está en `qa/CRITERIOS-ACEPTACION.md`. PWA-03 volvió a ejecutarse y dio PASS: pantalla Sin conexión, HTTP 503/no-store, Reintentar, ausencia de operaciones clínicas y retorno al login tras reconectar. DATA-04 comprueba además la conservación del pendiente y el retorno seguro al editor sin reproducción automática del guardado.

No se modificó `v4/sw.js` ni se rehízo la pantalla existente. La aplicación abierta bloquea el espacio clínico cuando detecta desconexión o una verificación fallida, y revalida antes de habilitarlo nuevamente.

## Regresión completa ejecutada

- Reglas: aislamiento A/B y anónimo; perfiles habilitados, suspendidos y ausentes; permisos administrativos y esquema; chunks/getAfter y revisiones; lectura/escritura de suscripciones vencidas.
- Datos: persistencia entre clientes y tras recarga; dos escrituras concurrentes con una única revisión ganadora; listener; backup aditivo, reimportación sin duplicados y reversión; fotos y adjuntos íntegros; cambio de foto y de usuario.
- Interfaz: pacientes, responsables, campos obligatorios, servicios, turnos y límite de 30 minutos, caja, vacunas, reportes por período, exportación y restauración revisada con copia previa, login y correo recordado, contraseña visible y responsive Chromium.
- Authentication: ingreso/cierre, contraseña incorrecta, usuario deshabilitado, recuperación mediante código local y claim administrativo ficticio.
- Conexión y PWA: regla actual de Internet obligatorio, pantalla y Reintentar; recuperación de copia, timeout, conflicto y cambio de identidad. APP-RUNTIME confirma ausencia de excepciones JavaScript no controladas y de destinos externos en la prueba integrada.

La captura de errores identificó un problema del runner: bloquear Service Workers mediante Playwright inyectaba código que fallaba en el iframe sandbox. Se retiró ese bloqueo artificial; no se debilitó el sandbox ni se presentó como defecto productivo. El editor ya excluía el registro SW de su contenido.

## Evidencias y entorno

`manifest.json` fija hashes de aplicación, adaptador, SDK, reglas y runners. Los JSON de cada suite incluyen estados reales, fechas de ejecución y alcance. Logs, screenshots de recuperación, copia previa de restauración y descargas ficticias están en `qa/resultados/correcciones/`. Las preparaciones fallidas superadas no se contaron como fallos de aplicación ni se usaron resultados de ejecución cero.

Node 24.19.0, Java 21, Playwright 1.58.2, Firebase SDK 12.4.0, rules-unit-testing 5.0.0, Firestore Emulator oficial 1.22.0 y Chromium del entorno. Auth integrado en 9299 y Firestore en 8180, exclusivamente locales y con proyecto emulado jat-vet-pruebas; Auth demo separado en 9199. La aplicación corregida usa endpoints locales nativos en modo emulador; el runner no redirige solicitudes hacia Firebase remoto y aborta cualquier destino externo. La audiencia local coincide con las reglas sin credenciales productivas.

Este checkout contiene artefactos web; no hay build Vite definido en esta rama. Se verificó sintaxis de módulos y se cargaron/ejecutaron realmente los archivos corregidos en Chromium. Reproducción, hashes y orden de suites: `qa/DESPLIEGUE-SEGURO.md`.

## Bloqueos y riesgos pendientes

| ID | Falta |
|---|---|
| PWA-04 | Instalación real en Android e iOS o un servicio de dispositivos autorizado. Un viewport móvil Chromium no lo sustituye. |
| PWA-05 | Actualización/migración entre versiones instaladas en esos dispositivos, usando una versión de QA aprobada. No se desplegó una versión para esta prueba. |
| OPS-01 | Lectura HTTPS del sitio publicado: jat-nb.github.io sigue fuera de la política efectiva de esta instancia. No se afirma correspondencia con el despliegue actual. |
| AUTH-REAL-01 | Entrega real de correo, prohibida por el alcance. Requiere buzón QA y autorización específica; el código emulado sí pasó. |

**Límite de recuperación:** la copia privada se conserva en la misma pestaña, incluso al cambiar de cuenta; no sobrevive necesariamente a cerrar, recargar, caer o terminar el proceso del navegador. Se muestra la advertencia, se usa beforeunload y se exige solicitar la descarga antes del cierre de sesión con pendientes. El propietario debe verificar el archivo antes de cerrar o descartar. No se promete un vault clínico durable ni se introduce almacenamiento offline persistente sin un diseño de seguridad aprobado.

Los clientes que ya están publicados no incorporan estas correcciones. No se afirma que SEC-05 esté corregido en producción hasta desplegar las reglas autorizadas. Los workflows existentes de publicación reconstruyen otra rama y podrían excluir estos cambios: deben revisarse antes de usarlos.

## Entrega y condición para publicar

Revisar código, propuesta de reglas y política aprobada. Completar los cuatro bloqueos para certificar comercialización completa y autorizar explícitamente el despliegue. Instrucciones de publicación coherente, comprobaciones previas y rollback sin reabrir vencimientos: `qa/DESPLIEGUE-SEGURO.md`.

El borrador del entorno quedó actualizado con install_script y start_skill. Para reutilizarlo, revisar y guardar en configuración del entorno y publicar el entorno; esto no publica la aplicación ni las reglas. No se verificó restauración en una tarea nueva.
