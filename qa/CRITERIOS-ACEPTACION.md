# Criterios aprobados para esta corrección

Confirmados por el propietario en la conversación del 21/10/2026. Se aplican a la rama `fix/qa-seguridad-recuperacion-2026-10-21`.

## SEC-05

- `expiry` usa exclusivamente AAAA-MM-DD, válido hasta el final del día argentino UTC-03.
- El límite exclusivo es las 03:00 UTC del día siguiente; el último nanosegundo anterior sigue autorizado.
- Perfiles habilitados sin expiry o con string vacío mantienen acceso por compatibilidad. No se modifican perfiles para migrarlos.
- Fechas inválidas y perfiles suspendidos no habilitan acceso. La decisión obligatoria de lectura/escritura se toma en Firestore con `request.time`.
- Un administrador con perfil suspendido o vencido tampoco accede ni se reactiva desde la aplicación. Se conserva el bootstrap administrativo previo cuando no existe su perfil, condicionado al claim administrativo auténtico.

## DATA-04 / DATA-04-REVOKE

- Una operación enviada a guardar conserva su snapshot completo hasta confirmar exactamente su revisión guardada, o hasta descarte explícito del propietario.
- Desconexión, timeout, suspensión, conflicto y cambio de identidad no borran esa copia.
- Solo el UID autenticado propietario puede descargarla. Iniciar sesión como otro usuario no muestra ni descarga la copia ajena.
- No se permite seguir editando offline, guardar con permiso revocado ni sobrescribir una revisión de otra sesión.
- Reintentar una conexión revalida acceso y lee el servidor; no reproduce escrituras automáticamente. Reintentar un guardado requiere confirmación y la misma revisión.
- El cierre de sesión exige solicitar la descarga si hay pendientes; la copia permanece aislada en memoria durante el cambio de usuario en la misma pestaña.
- No se almacenan datos clínicos en localStorage o sessionStorage. La copia en memoria no es almacenamiento durable: antes de cerrar, recargar o abandonar la pestaña hay que verificar el archivo descargado. El navegador puede impedir la conservación en memoria al destruir la página; no se promete recuperación tras cierre o caída del proceso.

## PWA-03 — revisión del requisito

**Requisito anterior:** aplicación veterinaria utilizable al recargar offline. Dio FAIL. Se conservan el informe anterior y su matriz en `qa/historico/`, además de los resultados originales `qa/resultados/continuacion/offline.json`, capturas y logs, sin sobrescribirlos.

**Requisito aprobado actual:** Internet obligatorio. Sin red se presenta Sin conexión y Reintentar; no hay operaciones clínicas disponibles. Al recuperar Internet se revalida el acceso antes de volver al editor y se protegen los pendientes.

Se vuelve a ejecutar el mismo ID PWA-03 con el nuevo criterio; su cambio a PASS requiere esa ejecución, no una reclasificación administrativa. La pantalla y SW existentes no se rehacen. La recuperación de una operación en curso se comprueba adicionalmente en DATA-04 y RECOVERY-TIMEOUT.
