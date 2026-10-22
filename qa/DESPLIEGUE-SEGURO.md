> Para 4.0.2 RC1 usar `qa/releases/4.0.2-rc1/PLAN-PUBLICACION.md`. Este documento conserva instrucciones históricas y arranque de emuladores. No ejecutar el comando productivo histórico en esta preparación. Los runners ahora escriben en `qa/resultados/4.0.2-rc1/`.

# Despliegue futuro — requiere autorización explícita

Este documento contiene instrucciones para una publicación posterior. **No se ejecutó ningún despliegue ni merge.** La aplicación y las reglas publicadas siguen sin estos cambios.

## Preparar y revisar

1. Revisar el commit de la rama `fix/qa-seguridad-recuperacion-2026-10-21`, el informe, los archivos de evidencia y `qa/CRITERIOS-ACEPTACION.md`. Resolver los cuatro bloqueos externos antes de certificar comercialización completa.
2. Revisar `qa/firestore/firestore.proposed.rules` frente a `qa/firestore/firestore.rules`, copia de referencia aportada por el propietario. El original tiene SHA-256 `6dac84f09a73458c96e56afc93f1ef20c14614f20e3836cc259a255fe1733cba`. Volver a obtener las reglas publicadas y su versión desde Firebase antes del cambio; si difieren de esa referencia, detenerse y reconciliar, sin sobrescribir cambios ajenos.
3. Un operador autorizado debe comprobar en forma de solo lectura formatos de expiry y administradores: ISO, vacío o ausente; identificar fechas inválidas que quedarán bloqueadas. No exportar información clínica al repositorio. No convertir ni editar perfiles automáticamente.
4. Verificar la hora del entorno y la política Argentina UTC-03. Aprobar expresamente que los perfiles legacy sin vencimiento declarado mantienen acceso, y que un admin con perfil suspendido/vencido queda bloqueado hasta intervención autorizada fuera de la app.
5. Comprobar que las copias de recuperación descargadas se almacenan en un dispositivo seguro. Explicar a los usuarios que deben verificar su copia antes de cerrar o recargar una pestaña con pendientes; la memoria del navegador no es un respaldo durable.

## Reproducir QA sin producción

```sh
bash /workspace/jatvet/qa/preparar-entorno.sh
```

En procesos separados, esperar API endpoint y All emulators ready:

```sh
bash /workspace/qa-tools/firestore-official/cloud_firestore_emulator --host 127.0.0.1 --port 8180 --project_id jat-vet-pruebas --single_project_mode true --single_project_mode_error true --rules /workspace/jatvet/qa/firestore/firestore.proposed.rules
cd /workspace/qa-tools
XDG_CONFIG_HOME=/workspace/qa-tools/config FIREBASE_CLI_DISABLE_TELEMETRY=1 ./node_modules/.bin/firebase emulators:start --only auth --project jat-vet-pruebas --config /workspace/jatvet/qa/firestore/firebase.proposed.json
```

El Auth demo de la suite original se arranca aparte en 9199 con `qa/firebase.json` y proyecto demo-jatvet-qa. La aplicación corregida usa directamente Auth 9299 y Firestore 8180 cuando se abre en localhost con `?emulators=1`. No precisa redirecciones a endpoints de Firebase.

Desde /workspace/jatvet ejecutar secuencialmente, registrando cada exit code:

```sh
NODE_PATH=/workspace/qa-tools/node_modules node qa/firestore/integracion.cjs
NODE_PATH=/workspace/qa-tools/node_modules node qa/firestore/expiry.cjs
NODE_PATH=/workspace/qa-tools/node_modules node qa/firestore/boundary.cjs
NODE_PATH=/workspace/qa-tools/node_modules node qa/firestore/navegador.cjs
NODE_PATH=/workspace/qa-tools/node_modules node qa/certificacion.cjs
NODE_PATH=/workspace/qa-tools/node_modules node qa/offline.cjs
NODE_PATH=/workspace/qa-tools/node_modules node qa/auth-emulador.cjs
node tests/actualizacion-silenciosa.cjs
python3 qa/consolidar-correcciones.py
```

No ejecutar los runners Firestore simultáneamente. Integración limpia exclusivamente el emulador local; boundary carga reglas temporales sin rutas clínicas para comprobar el helper exacto y restaura las reglas propuestas completas en finally. Si se interrumpe, volver a arrancar el emulador con las reglas propuestas antes de otros tests. Los resultados nuevos quedan en `qa/resultados/correcciones/`; no se sobrescriben las evidencias históricas del fallo offline.

## Cuando se autorice publicar

- Acordar una ventana y el proyecto/sitio exactos; no inferir por el nombre jat-vet-pruebas que no contiene usuarios reales.
- Preparar una versión de aplicación y reglas coherente con los hashes del manifiesto. Los cambios de aplicación son `v4/app-session.js`, el adaptador en `assets/v4-backup-restauracion-20261019.js` y la referencia versionada en `v4/index.html`. No olvidar el módulo nuevo ni sustituir los bundles de dependencias por versiones no probadas.
- **No ejecutar sin adaptar los workflows existentes de publicación:** leen `desarrollo-v4-firebase` y reconstruyen/copían artefactos desde otra rama. Podrían sobrescribir o excluir estas correcciones. Integrar el cambio en la fuente o fijar los artefactos revisados antes de reconstruir. Es una condición del despliegue, no un paso que se haya realizado aquí.
- Publicar solo con autorización separada y privilegios mínimos. Para las reglas, el comando previsto es `firebase deploy --only firestore:rules --project jat-vet-pruebas --config qa/firestore/firebase.proposed.json`, únicamente después de confirmar que ese es el proyecto aprobado y que el archivo corresponde al commit revisado. **No se ejecutó este comando.** La configuración propuesta no incluye Hosting.
- Coordinar la actualización de clientes y las reglas en la ventana aprobada; evitar dejar clientes antiguos sin la recuperación corregida frente a las nuevas denegaciones. Verificar reapertura con la nueva referencia versionada del módulo. No recargar automáticamente una sesión con cambios pendientes.
- Tras publicación, usar únicamente cuentas de QA autorizadas para verificar acceso vigente/vencido/suspendido, aislamiento y guardado/recuperación. No ejecutar los fixtures de limpieza ni initializeTestEnvironment contra servicios remotos, ni usar datos de Verónica o de otros veterinarios.
- Mantener copia y versión de las reglas previas y de los artefactos anteriores. Cualquier rollback debe aprobarse: restaurar reglas antiguas reabriría el fallo de suscripciones. Preferir una corrección compatible que preserve el bloqueo servidor antes que debilitarlo por una incidencia de interfaz.
