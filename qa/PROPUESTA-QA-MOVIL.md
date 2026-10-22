# Entorno móvil aislado — propuesta pendiente de autorización

Fecha: 2026-10-22. Rama: `fix/qa-seguridad-recuperacion-2026-10-21`.
Base revisada: `d5582a94d7c9c06e0367871a4e7afaebfefffd1a`.
No se crearon recursos, cuentas remotas ni despliegues para esta propuesta.

## Destino exacto propuesto

- Proyecto Firebase/Google Cloud NUEVO: `jatvet-qa-movil-261022-a7c4`.
- Sitio Firebase Hosting: `jatvet-qa-movil-261022-a7c4`.
- URL prevista: `https://jatvet-qa-movil-261022-a7c4.web.app/jatvet/v4/`.
- Firestore Native: base `(default)`, región propuesta `southamerica-east1`.
- Authentication: email/contraseña, cuentas exclusivamente ficticias.
- Nombre visible de la PWA: `JAT Vet QA móvil`.

Identificadores propuestos, no reservados ni verificados disponibles. Si están ocupados, detenerse y presentar otro destino antes de publicar. No usar `jat-vet-pruebas`: contiene usuarios reales. No cambiar DNS, URLs ni recursos existentes. No habilitar facturación ni recursos pagos dentro de esta autorización.

## Alcance a autorizar en conjunto

1. Crear/configurar ese proyecto, app web, Authentication, base y sitio, bajo la titularidad del propietario. Si requiere organización, facturación o permisos no disponibles, informar el requisito y detener esa operación.
2. Preparar un artefacto desde la rama indicada, con configuración Firebase exclusiva del nuevo proyecto, validación estricta de esa configuración, audiencia de tokens y consulta REST de perfiles apuntando únicamente al proyecto nuevo. No admitir fallback al backend existente.
3. Copiar las reglas propuestas a una variante para este proyecto, cambiando únicamente su audiencia. Publicar esa variante SOLO en el proyecto nuevo; conservar intactas las reglas originales/publicadas del proyecto existente.
4. Crear fixtures ficticios: dos veterinarios habilitados aislados, vencido, suspendido y administrador de QA. No copiar perfiles ni datos existentes. No guardar contraseñas en Git ni incluirlas en logs o este documento.
5. Publicar una primera versión QA-M1 y, tras las verificaciones de seguridad, una segunda QA-M2 en el MISMO sitio para probar actualización. Ambos despliegues quedan limitados al sitio indicado, sin merge y sin workflows actuales de publicación.
6. Ejecutar comprobaciones HTTPS y regresión sobre datos ficticios; documentar resultados y facilitar la prueba física Android/iPhone. No ejecutar limpiadores de emulador contra el backend remoto.

## Preparación y comprobaciones antes de la primera publicación

- Los artefactos existentes usan rutas `/jatvet/`; ensamblar Hosting con `jatvet/v4/` y `jatvet/assets/`, conservando módulos e iconos requeridos. No publicar el repositorio completo, informes, backups, scripts ni credenciales.
- Revisar referencias en `v4/app-session.js`, configuración pública, validadores del SDK compilado y reglas. El código actual está fijado a `jat-vet-pruebas`; cambiar solo el JSON no establece aislamiento.
- Etiquetar la instalación QA en el manifiesto; su origen HTTPS independiente aísla instalación, almacenamiento y service worker respecto de producción.
- Reejecutar en emuladores las reglas adaptadas y verificar configuración, aislamiento y ausencia de solicitudes al proyecto existente antes de publicar la aplicación.
- Comprobar HTTPS, redirecciones, MIME de módulos/manifiesto/SW, iconos, scope, autenticación y acceso autorizado/denegado. Registrar commit y hashes de ambas versiones. Servir HTML/manifiesto/SW con revalidación para probar actualización.
- No activar los workflows existentes: construyen otra rama y apuntan al proyecto existente.

## Evidencia móvil que falta

Antes de autorizar/publicar NO puede verificarse esta URL en un teléfono. Una emulación de viewport tampoco certifica instalación nativa.

- Android: abrir URL en Chrome, instalar/agregar a pantalla principal, comprobar modo independiente, identidad QA, login ficticio y operaciones clínicas con Internet.
- iPhone: abrir URL en Safari, Compartir → Agregar a inicio; comprobar apertura desde el icono y repetir casos funcionales.
- En ambos: probar corte/reconexión, Reintentar, copia pendiente y recuperación del mismo propietario, cierre de sesión y aislamiento. Descargar/verificar recuperación antes de cerrar o recargar con cambios pendientes: la copia en memoria no sobrevive al cierre de pestaña.
- Para actualización QA-M1 → QA-M2: confirmar versión, conservar sesión y registros ficticios, no perder pendientes ni recargar automáticamente una sesión en edición. Registrar modelo, versión SO/navegador, capturas y resultado real.

## Requisitos externos actuales

El estado del entorno no declara identidades Google conectadas ni capacidades de despliegue. Hay nombres de variables de credenciales, pero eso no demuestra permisos utilizables; no se leyeron sus valores. Hace falta conectar una identidad autorizada mediante el mecanismo seguro del entorno (o que el propietario cree el proyecto y conceda acceso limitado). No enviar contraseñas reales ni claves privadas por chat.

También debe habilitarse la conectividad del entorno hacia las APIs Google/Firebase y el dominio de Hosting que se utilicen, respetando la política de red. Aprobación del destino no equivale a disponer de credenciales o conectividad.

Estado: propuesta local revisable; creación, despliegue, HTTPS público e instalación/actualización física PENDIENTES. No se modifica la matriz de certificación ni se declara ningún PASS nuevo.

## Autorización recibida y bloqueo observado

El propietario autorizó expresamente el proyecto/sitio indicados, Authentication, Firestore, reglas QA adaptadas, fixtures ficticios y dos publicaciones QA. No hace falta volver a pedir esa autorización. No habilita producción, `jat-vet-pruebas`, GitHub Pages ni datos reales.

Comprobación posterior: `firebase projects:list --json --non-interactive` terminó con código 2 y `Failed to authenticate, have you run firebase login?`. El estado vigente del entorno informó `observations_current: true`, sin identidades Google conectadas, y el manifiesto de identidades no contiene conexiones. No se ejecutó login interactivo, creación ni despliegue. No se pudo verificar disponibilidad o titularidad del destino remoto.

Se preparó `qa/preparar-qa-movil.py`: genera Hosting, reglas adaptadas y archivos públicos en un directorio NUEVO fuera del repositorio, sin ejecutar operaciones remotas. Exige esta rama y proyecto, conserva la validación estricta de los seis campos de configuración Firebase, comprueba bucket/app ID, elimina referencias al proyecto existente y prepara identificadores QA-M1/QA-M2. No modifica los archivos fuente de la aplicación. El artefacto no incluye informes, backups, credenciales ni el repositorio completo.

Verificaciones locales ejecutadas: ensamblado de QA-M1 y QA-M2 con configuración explícitamente sintética/no registrada; rechazo de proyecto ajeno, bucket ajeno y app ID inconsistente; ausencia del ID del backend existente en ambos artefactos; comprobación sintáctica del módulo y `git diff --check`. Estas comprobaciones NO validan una app registrada, permisos Google, reglas remotas, autenticación remota, HTTPS ni instalación física. No cambian el resultado de la certificación.

Para continuar hace falta conectar una identidad Google autorizada en el entorno seguro, con permiso para crear ese proyecto y administrar Firebase/Hosting/Auth/Firestore dentro de él; alternativamente el propietario puede crear ese proyecto exacto y conceder acceso a una identidad del entorno. No enviar claves privadas ni contraseñas reales por chat. Volver a comprobar acceso y destino antes de cualquier escritura. Si surge un requisito adicional de organización, facturación o privilegios, detenerse e informarlo.

Ejemplo local una vez obtenida la configuración pública REAL de la app web QA (no una cuenta/clave privada):

```sh
python3 qa/preparar-qa-movil.py --config /tmp/firebase-qa-web-config.json --output /tmp/jatvet-mobile-QA-M1 --version QA-M1
```

Antes de publicar, cotejar esos seis valores contra el registro remoto de la app web del proyecto exacto, verificar proyecto/sitio, reejecutar reglas adaptadas y pruebas de navegador con el artefacto. No desplegar el ejemplo sintético. Las credenciales ficticias se generarán únicamente cuando exista Authentication QA y se entregarán mediante un canal seguro disponible, nunca en Git, informes públicos o logs. Por ahora no existen cuentas ni credenciales móviles que entregar.
