# JAT Vet 4.0.2 RC1 — publicación y recuperación

Preparación del 21/10/2026, hora Argentina. Sin nuevas funcionalidades. Rama única: `fix/qa-seguridad-recuperacion-2026-10-21`. No merge, despliegue, reglas remotas, cuentas reales ni datos clínicos reales. La autorización vigente de esta tarea permite preparar y probar, no publicar.

## Contenido congelado

Se mantienen las correcciones de acceso por perfil habilitado, vencimiento ISO hasta fin del día argentino, aislamiento, recuperación por propietario y funcionamiento exclusivamente conectado. Perfiles habilitados sin expiry o con valor vacío conservan acceso; fechas inválidas y perfiles suspendidos bloquean. El servidor aplica las reglas propuestas, aún NO publicadas. Los cambios pendientes siguen en memoria de la pestaña; se debe descargar y verificar la copia antes de cerrar/recargar. No se promete recuperación durable después de cerrar, matar el navegador o reiniciar el teléfono.

La etiqueta de la aplicación, `version.json` raíz y V4, manifiestos y marcadores de SW indican 4.0.2/RC1. No se cambian id, start_url ni scope de las instalaciones existentes. La versión en el manifiesto es metadata adicional: el navegador detecta actualización por contenido del SW y revalidación, no por ese campo. Se reutiliza la pantalla de desconexión aprobada también en la entrada raíz, sin otra interfaz ni operaciones offline.

## Inventario completo y paquete

La lista ejecutable y auditable está en `qa/empaquetar-402.py`, constante FILES:

- Raíz: `index.html`, `version.json`, `manifest.webmanifest`, `install.js`, `sw.js`, `firebase-config.json`.
- V4: `index.html`, `version.json`, `manifest.webmanifest`, `install.js`, `sw.js`, `firebase-config.json`, `app-session.js`, iconos 192/512/apple-touch y SVG login-logo/login-pets.
- Assets: `v4-backup-restauracion-20261019.js`, `repository-CdXTqB56.js`, `repository-CQZTQ0JS.css`.
- Reglas fuera del directorio público: `qa/firestore/firestore.proposed.rules`. La referencia aportada por el propietario sigue intacta en `qa/firestore/firestore.rules`.

El generador copia únicamente estos archivos, preservando `/jatvet/` y `/jatvet/v4/`. Escribe hashes SHA-256 y commit en `artifact.json`. No hace npm build ni usa código de otra rama. No publicar informes, fixtures, scripts, backups o el repositorio completo. El paquete general conserva la configuración del backend original: NO sirve como preview aislada sin adaptación.

```sh
python3 qa/empaquetar-402.py /tmp/jatvet-402-paquete-revisado
```

## Puertas de salida antes de autorizar publicación

1. Revisar commit final, hashes, matriz y logs de `qa/resultados/4.0.2-rc1/`. Ejecutar `python3 qa/regresion-402.py` con los tres emuladores locales iniciados según `qa/DESPLIEGUE-SEGURO.md`, después `python3 qa/consolidar-correcciones.py`. No ejecutar estos fixtures contra servicios remotos. El nombre local `jat-vet-pruebas` solo representa el namespace emulado en loopback, nunca autorización para tocar ese proyecto remoto.
2. Resolver los cuatro bloqueos externos de la tabla siguiente. Los controles sintéticos de instalación y el SW Chromium local no los sustituyen.
3. Aprobar separadamente destino, ventana, operador, artefactos exactos y cambios de reglas. Sin acceso Google seguro no se puede verificar destino ni publicar. No pedir contraseñas reales. No modificar perfiles existentes automáticamente.
4. Antes de cada publicación, consultar el proyecto exacto, app web y sitio mediante CLI autenticada de solo lectura; cotejar todos los campos públicos registrados de Firebase y el sitio con el artefacto. Si difieren, parar. No usar un proyecto por su nombre aparente de pruebas.

## Ensayo HTTPS aislado, solo después de una nueva autorización

Destino propuesto ya creado por el propietario: proyecto y sitio `jatvet-qa-movil-261022-a7c4`, URL prevista `https://jatvet-qa-movil-261022-a7c4.web.app/jatvet/v4/`. Su disponibilidad no está verificada. Auth email/password y Firestore São Paulo fueron informados por el propietario, no comprobados por este agente.

1. Con identidad segura conectada: `firebase apps:list --project jatvet-qa-movil-261022-a7c4` y `firebase hosting:sites:list --project jatvet-qa-movil-261022-a7c4`; comprobar base `(default)` y región en Console. No escribir si no se puede verificar el aislamiento.
2. Registrar/verificar la app web QA y guardar su configuración pública fuera de Git. Ejecutar `python3 qa/preparar-qa-movil.py --config /tmp/firebase-qa-web-config.json --output /tmp/jatvet-402-QA-M1 --version QA-M1`. Validar config estricta, consulta REST, audiencia y reglas apuntando solo al QA; reejecutar las reglas adaptadas en emulador antes de cualquier publicación. No desplegar configuraciones sintéticas.
3. Tras autorización y verificación de destino, publicar solo reglas QA con `firebase deploy --only firestore:rules --project jatvet-qa-movil-261022-a7c4 --config /tmp/jatvet-402-QA-M1/firebase.json`; crear únicamente cuentas/datos ficticios mediante un proceso limitado a ese proyecto verificado. No usar runners de limpieza locales contra QA remoto. No publicar reglas en `jat-vet-pruebas`.
4. Volver a verificar proyecto/sitio. Publicar solo Hosting QA con `firebase deploy --only hosting --project jatvet-qa-movil-261022-a7c4 --config /tmp/jatvet-402-QA-M1/firebase.json`. Config incluye `site` exacto. No `firebase use`, despliegues globales ni workflows históricos.
5. Registrar versión y hashes QA-M1; verificar HTTPS, módulos/MIME, manifiesto, iconos, SW scope, login, reglas vigentes/vencidas/suspendidas, aislamiento y recuperación con fixtures remotos. Entregar credenciales ficticias mediante un medio seguro disponible, nunca Git/logs públicos.
6. Ejecutar prueba física QA-M1 y conservar evidencia. Preparar QA-M2 con el mismo generador y configuración, con salida nueva. Volver a verificar destino y publicar solo ese Hosting QA para actualizar la misma instalación. Sin cambios de reglas ni limpieza entre versiones. No usar las publicaciones QA para producción.

## Cuatro verificaciones externas pendientes

| ID | Prueba final y evidencia requerida |
|---|---|
| PWA-04 | Android Chrome e iPhone Safari reales: abrir HTTPS, login ficticio, instalar/agregar a inicio, verificar icono/nombre y modo independiente, reabrir y operar conectado. Modelo, SO/navegador y capturas. La app oculta su botón propio durante login; el menú del navegador sigue siendo la vía alternativa. |
| PWA-05 | Misma instalación QA-M1 → QA-M2: reapertura muestra versión nueva, sesión y datos ficticios conservados, sin recarga espontánea durante edición; descargar recuperación antes de cerrar con pendientes. No instalar en otro origen y llamarlo actualización. |
| OPS-01 | Correspondencia del artefacto autorizado con el sitio realmente publicado: HTTPS, commit/hashes/versión, rutas, headers y backend QA correcto. La observación pública anterior no certifica una versión aún no desplegada. Producción solo se cotejará con autorización de publicación específica. |
| AUTH-REAL-01 | Entrega de recuperación por correo a un buzón exclusivo QA controlado, sin cuenta clínica ni correo de terceros. Registrar recepción/uso del enlace sin guardar el código de acción en evidencias. Los códigos del emulador ya se probaron; falta entrega real autorizada. |

En ambos celulares: altas y edición de clientes/mascotas, turnos, servicios, caja e informes; backup/restauración exclusivamente ficticios; corte de Internet durante edición y guardado; ninguna operación clínica offline; Reintentar recupera conexión con acceso validado; suspendido/vencido no escribe; copia pendiente solo visible para su propietario. Incluir cambio de usuario y cierre de sesión. No forzar cierre con pendientes sin antes verificar la descarga. Registrar cada resultado sin inferir PASS por una captura.

## Publicación productiva posterior

Requiere autorización explícita nueva con sitio/backend productivos exactos. No se ejecutó ni se dejó una automatización capaz de publicar por push. Ambos workflows históricos están deshabilitados en esta rama mediante `if: ${{ false }}`: reconstruían `desarrollo-v4-firebase` y uno copiaba resultados a main. No habilitarlos sin sustituir ese proceso por el artefacto congelado y revisado. Ningún comando de este documento autoriza publicar en producción.

La publicación completa debe ser atómica a nivel de Hosting: HTML, nuevo módulo de sesión, adaptador y dependencias juntos; no subir solo index.html. Revalidar HTML/manifiestos/SW/version.json (`Cache-Control: no-cache` o equivalente) y el módulo nuevo. Los módulos con nombre antiguo que cambiaron de contenido deben revalidarse también: no usar immutable global. Mantener id/scope de PWA. Coordinar cliente y reglas sin desactivar el control de vencimiento. Verificar la copia realmente publicada contra los hashes antes de liberar uso comercial.

## Recuperación sin pérdida ni reapertura de fallos de seguridad

Se conservan dos archivos locales, con commit y SHA-256 en `recuperacion-401.json`: 4.0.1 corregida (`3d1b1b1`) y referencia histórica de main (`c1547865`). El archivo de main es referencia de Git, NO prueba de lo que hoy está desplegado. Ambos pueden reconstruirse con `git archive <commit>`. La evidencia de 4.0.1 sigue en `qa/resultados/correcciones/` y el informe en `qa/historico/INFORME-401-CORREGIDA.md`.

Antes de publicar: guardar versión/release ID Hosting y reglas remotas actuales mediante operador autorizado, sin exportar datos clínicos a Git. Ante incidente: detener nuevas escrituras, mantener aviso de mantenimiento y permitir descarga de pendientes del propietario en sesiones abiertas. Guardar/verificar esas copias antes de recargar; no limpiar almacenamiento ni datos remotos. No restaurar backups de usuarios por un problema de Hosting.

Revertir Hosting solamente al artefacto anterior explícitamente revisado y compatible con las reglas vigentes, mediante operador autorizado y destino comprobado. No volver automáticamente a reglas que permitan suscripciones vencidas ni clientes que destruyan pendientes. Si no hay una combinación segura comprobada, mantener mantenimiento y preparar hotfix. Toda reversión/despliegue requiere autorización; la preparación local no concede permiso. Comprobar aislamiento y recuperación con fixtures antes de reabrir. No modificar datos de Verónica ni de otros veterinarios durante preparación o recuperación.
