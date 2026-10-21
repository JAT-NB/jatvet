# Propuestas para revisión — sin cambios productivos

## 1. Suscripciones vencidas (alta)

El perfil ficticio `enabled=true, expiry="2000-01-01"` puede leer y escribir según las reglas actuales aportadas. `expiry` solo tiene validación de tipo string; `access(uid)` no consulta su valor.

Definir formato, zona horaria, momento exacto de expiración y política para perfiles sin vencimiento. Diseñar una migración controlada a un vencimiento comparable con `request.time` en el servidor (por ejemplo un Timestamp), preservando los perfiles existentes. Aplicar la política a lectura y escritura, con excepciones administrativas explícitas. No basta esconder pantallas ni validar la fecha en JavaScript. Mantener los casos de vencimiento pasado, futuro, ausente y perfil suspendido como regresión. No se propone ni publica aquí un reemplazo de reglas.

## 2. Copia pendiente al fallar guardado o verificación de acceso (alta)

Con una desconexión de 13 segundos durante un guardado, el verificador de acceso periódico limpia el editor y la copia pendiente. Si se revoca el perfil inmediatamente antes del guardado, el mensaje dice que la copia se conserva pero su descarga queda oculta. Los tests no demuestran pérdida de datos previamente confirmados en Firestore; sí demuestran que la recuperación prometida de cambios pendientes deja de estar disponible.

Separar errores transitorios de red de una denegación confirmada. Mantener la aplicación bloqueada para nuevas operaciones hasta revalidar acceso, pero gestionar la copia pendiente por UID y generación de sesión antes de limpiar la interfaz. Diseñar una recuperación segura que no exponga información del usuario anterior al siguiente usuario ni permita continuar editando tras revocación. No vaciar el único respaldo pendiente antes de confirmar descarga o descarte explícito. Probar también carreras entre revalidación, respuesta tardía del guardado y cierre de sesión.

## 3. Navegación offline (media, requisito funcional por definir)

Se corrige el diagnóstico previo: el SW de esta rama **ya** devuelve HTML de desconexión con HTTP 503 y `Cache-Control: no-store`, no `Response.error()`. La pantalla, la ausencia de datos clínicos y el botón Reintentar se probaron y funcionan. Lo que sigue fallando es el caso que exige una aplicación veterinaria utilizable al recargar sin red.

La solución mínima segura es conservar esa pantalla degradada y asegurar la recuperación de cambios pendientes del punto anterior. Esto no habilita consultas o altas offline y no convierte PWA-03 en PASS bajo su criterio actual.

Si el producto exige trabajo clínico offline, hace falta una tarea separada: shell público versionado, almacenamiento local cifrado y separado por profesional, control de expiración y revocación offline, cola de cambios con revisiones y resolución de conflictos, y borrado seguro al cambiar de usuario. No cachear indiscriminadamente respuestas Firestore, perfiles, tokens ni datos clínicos. Aprobar ese diseño y probarlo antes de afirmar funcionamiento offline. No se modificó `v4/sw.js` ni se redefinió el caso para hacerlo pasar.

## 4. Enrutamiento de QA

La aplicación tiene un `verifyAccess` REST remoto fijo aun con `?emulators=1`. El runner lo redirige al emulador local y aborta el resto de destinos externos. Incorporar un modo de emuladores explícito y centralizado en una tarea de código posterior reduciría este riesgo. No usar las credenciales de veterinarios reales para reproducir las pruebas.
