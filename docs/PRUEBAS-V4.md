# Informe de pruebas — piloto JAT Vet 4.0

Resultados de esta sesión, 17 de octubre de 2026 (America/Buenos_Aires). Rama local `desarrollo-v4-firebase`, base `80d0575044729e3a0b9a6e0e708937fbcb5f9663`. No se hizo push, merge, despliegue ni migración de datos reales.

## Ejecutadas y aprobadas

| Comprobación | Resultado real |
|---|---|
| Instalación reproducible `npm ci` | Completada con lockfile, sin cambiar archivos de la versión anterior |
| `npm test` | 7 pruebas, 7 aprobadas, 0 fallidas, 0 omitidas |
| Migración con datos sintéticos | Conserva relaciones, fotos, adjuntos, metadatos y totales; reimportación idempotente por ID |
| Entradas inválidas | Rechaza conflictos, IDs duplicados, referencias rotas, caja inválida, adjuntos ejecutables y tamaño excesivo sin modificar la fuente |
| Codificación fragmentada | Ida/vuelta exacta, con Unicode y fotografías mayores de 1 MB |
| `npm run build` | Build Vite 8.3.4 completado |
| Navegador, 1366×900 y 390×844 | Pantalla de acceso; creación de paciente; reapertura desde copia en memoria; navegación por 8 secciones; alta, edición y eliminación de servicio |
| Regresión del almacenamiento anterior | Clave `jat-vet-v2.9-qa` conservada intacta en ambos contextos de prueba |
| JavaScript del navegador | Sin excepciones en esos recorridos |
| Authentication Emulator: administrador y profesional | Contraseña incorrecta, recuperación, inicio y cierre de sesión aprobados con cuentas sintéticas locales; controles administrativos visibles sólo para el UID configurado |
| Archivos originales | `git diff` contra la base: `index.html` y `acceso-prueba.html` sin cambios |
| Auditoría de dependencias de ejecución | `npm audit --omit=dev`: 0 vulnerabilidades reportadas tras actualizar dependencias y fijar gRPC |

La reapertura y el CRUD del navegador se probaron con un callback de memoria del adaptador. **No demuestran persistencia en Firestore.** La recuperación se probó contra el emulador; no demuestra entrega real de correos. El tamaño de celular emula el viewport de Chromium; no sustituye una prueba en un teléfono físico.

## Bloqueadas o no ejecutadas

| Comprobación | Estado y causa |
|---|---|
| Suite de reglas, 4 casos preparados | No ejecutada: falló la descarga de Firestore Emulator, `storage.googleapis.com`, respuesta inicial 403 «Domain forbidden» |
| Aislamiento real entre profesionales | Pendiente de la suite de reglas y de una verificación autorizada en Firebase |
| CRUD y persistencia Firestore | Código y suite de integración preparados; sin resultado ejecutado |
| Conflictos y sincronización entre dispositivos sobre Firestore | Pendiente; actualmente el diseño notifica revisión externa y exige recarga explícita |
| Inicio de sesión de las cuentas reales | No ejecutado; no se solicitaron contraseñas reales |
| Cuenta de la hermana | No creada; UID desconocido, no inventado |
| Importación del respaldo real | No ejecutada, requiere cuenta verificada, respaldo revisado y autorización |
| Fotos, PDF, turnos, vacunas y caja de extremo a extremo en Firebase | Pendiente; no se confunde preservación de JSON con validación funcional completa |
| URL pública independiente | No creada: faltan validación de Firebase, acceso de despliegue y autorización de publicación |
| Teléfono físico y navegadores adicionales | No ejecutado |

## Errores encontrados y corregidos

- Configuración CLI fuera de rutas escribibles: se documentaron `XDG_CONFIG_HOME` y `FIREBASE_EMULATORS_PATH` dentro de `/workspace`.
- Error de desarrollo de Vite tras actualizar dependencias con el proceso anterior vivo: se reinició únicamente el servidor iniciado por esta sesión; prueba final sin esa excepción.
- La prueba móvil intentaba usar el menú de escritorio oculto: se corrigió para navegar mediante tarjetas y barra inferior visibles.
- El emulador devolvió `auth/wrong-password`: se agregó su traducción y la de cuenta inexistente al mismo mensaje de acceso inválido.
- Se escaparon atributos de fotografías y se aisló el HTML anterior en un iframe de origen opaco con CSP, sin acceso a la sesión ni al almacenamiento local del contenedor.
- Se evitó separar pares Unicode entre fragmentos y se añadió un límite seguro de 4 MB para este piloto, con rechazo completo en lugar de pérdida parcial.

## Pendientes técnicos antes de aceptar una versión definitiva

El almacenamiento por espacio completo es transitorio. Falta almacenamiento por entidad y archivos en Storage para espacios mayores, cola durable de cambios fallidos, auditoría de soporte, pruebas completas de regresión y revisión del respaldo real. La administración actual habilita/suspende acceso a Firestore por UID; no gestiona el ciclo de vida de cuentas de Authentication. Persistir el nombre de bienvenida por perfil también está pendiente.

La auditoría completa de herramientas de desarrollo reportó 10 avisos (7 moderados y 3 altos), principalmente en dependencias transitivas de Firebase CLI; no están en el bundle de la aplicación. Deben revisarse antes de habilitar un pipeline de publicación. No se aplicaron overrides incompatibles para esconder esos avisos.

Se guardaron dominios requeridos en el borrador cloud, sin afirmar que ya estén aplicados. Aplicar esa configuración permite reintentar el emulador; publicar una configuración del entorno cloud no equivale a desplegar la aplicación. No se modificaron reglas remotas ni se comprobó el estado de reglas existentes en `jat-vet`.

## Revalidación después de la publicación del entorno

Se volvió a ejecutar la instalación disponible, la suite de datos, la compilación y los recorridos de navegador. Resultado actual: **13 pruebas unitarias aprobadas**, 0 fallidas, 0 omitidas: las 7 originales más 6 protecciones del diagnóstico con repositorios en memoria. Build aprobado. Se repitieron con éxito los recorridos de escritorio/celular y el login, error de contraseña, recuperación y logout de administrador y profesional en Authentication Emulator. No se autenticó la cuenta real del administrador.

Se añadió una prueba funcional de descarga: el navegador exportó un JSON real desde el iframe y el archivo coincidió exactamente con el respaldo sintético, incluyendo fotos, archivos, relaciones y totales. Se confirmó que la página de diagnóstico no hace solicitudes a Firebase antes del consentimiento.

Firestore sigue bloqueado. La CLI informa `Failed to make request to https://storage.googleapis.com/firebase-preview-drop/emulator/cloud-firestore-emulator-v1.22.0.jar`. Una petición de diagnóstico por la ruta HTTPS configurada devuelve `curl: (56) CONNECT tunnel failed, response 403` y `HTTP/1.1 403 Forbidden` desde `envoy`. No es una prueba de credenciales incorrectas de Firebase: el rechazo ocurre en el proxy antes de llegar al servicio.

La configuración publicada incluye los siete dominios requeridos, pero la instancia activa sigue asociada a la versión anterior y la política aplicada muestra `allowed_hosts: []`. No se guardaron requisitos duplicados ni se debilitó la verificación TLS. Hace falta una instancia vinculada a la versión publicada para reintentar el emulador. No se dispone de una sesión administrativa de Firebase CLI en esta instancia.

La suite de Firestore ahora contiene **6 casos preparados y no ejecutados**, incluidos el diagnóstico con migración sintética y la recepción de una revisión por un listener de un segundo cliente. No se presentan como aprobados. La página de diagnóstico contra el proyecto de desarrollo está preparada, pero tampoco se ejecutó con cuentas reales. Su lógica de protección se validó solamente con repositorios en memoria. Procedimiento: `docs/DIAGNOSTICO-FIREBASE.md`.

Se corrigieron dentro del adaptador V4 los mensajes de la pantalla de respaldo que todavía afirmaban que toda importación reemplazaba los datos y que no había cuentas; el HTML original permanece intacto. No hubo push, merge, cambios remotos de reglas, publicación de la aplicación ni migración real. La limitación de 4 MB y los demás pendientes técnicos continúan vigentes.
