# Diagnóstico exclusivo de jat-vet-pruebas

Ejecutar `npm run dev -- --port 5180 --strictPort` y usar la ruta `/v4/diagnostico.html` en la dirección local que imprime Vite. No es una URL pública de cloud.

El diagnóstico sólo inicializa la configuración web registrada de `jat-vet-pruebas`. El administrador debe poseer el custom claim booleano `jatvetAdmin:true`; no se acepta un UID administrativo previo. Dos profesionales deben ser distintos, tener correos con prefijo `jatvet-v4-test-` o `jatvet-v4-test+` y espacios de Firestore inexistentes. Si encuentra cualquier espacio anterior, cancela antes de escribir.

Con confirmación explícita, crea únicamente un respaldo sintético. Verifica lectura exacta y totales, reimportación sin duplicados, segunda sesión, permisos denegados entre profesionales, acceso de soporte, edición y espacio propio de B. Un fallo de red nunca cuenta como aislamiento aprobado. La limpieza se activa tras una ejecución completa y sólo vacía registros de ese marcador; no elimina cuentas ni documentos raíz. No cargar respaldos reales.

La entrega automática `npm run entregar:pruebas` crea las cuentas sintéticas necesarias mediante Firebase CLI y ejecuta el diagnóstico; no hace falta elegir UIDs. Requiere autorización administrativa de Google sobre el proyecto de pruebas y acceso de red efectivo. Las contraseñas se usan sólo en memoria o en el archivo local ignorado `.test-secrets/`; no deben enviarse por chat ni guardarse en Git.

Estado real de esta sesión: Authentication Emulator y pantallas aprobadas; Firestore y diagnóstico real pendientes. La descarga del emulador responde `CONNECT tunnel failed, response 403`, y la consulta de Hosting responde `Failed to authenticate, have you run firebase login?`. La configuración de la plataforma anuncia dominios permitidos, pero el proxy de esta instancia todavía rechaza la descarga; no se debilitó TLS ni se inventaron credenciales.
