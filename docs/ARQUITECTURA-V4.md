# Arquitectura del piloto de pruebas

La única aplicación Firebase aceptada es la registrada en `jat-vet-pruebas`. `v4/environment.js` verifica projectId, dominio de Authentication, bucket, appId, senderId y apiKey antes de `initializeApp`. El diagnóstico usa exactamente el mismo validador. No existe fallback a otro proyecto.

El administrador se reconoce por el custom claim booleano `jatvetAdmin:true` del token firmado por Firebase Authentication del proyecto de pruebas. Ningún UID tiene privilegios por estar escrito en el cliente. Las reglas requieren el audience `jat-vet-pruebas` y ese claim para operaciones administrativas. Los usuarios normales sólo acceden a su espacio. No pueden escribir perfiles ni claims. Un administrador puede etiquetar/suspender acceso a Firestore; esto no revoca tokens ni reemplaza una gestión completa del ciclo de vida de cuentas de Authentication.

`workspaces/{uid}` contiene revisión, cantidad de fragmentos y actor. `workspaces/{uid}/chunks/{n}` contiene partes del JSON; `profiles/{uid}` habilitación y etiqueta. Escrituras transaccionales con revisión esperada; los cambios simultáneos se rechazan. Un listener avisa cambios y el usuario recarga explícitamente. El guardado se relee y compara antes de confirmarlo. Fotografías y archivos se mantienen como data URLs. Límite del piloto: 4 MB por espacio, sin cola offline durable ni Storage. La copia pendiente puede descargarse ante un error; no cerrar sin conservarla.

Las pantallas anteriores se mantienen en un iframe de origen opaco con CSP, sin acceso al localStorage ni al token Firebase del contenedor. El adaptador cambia los puntos de carga/guardado y dirige importaciones a la revisión aditiva. El HTML original permanece intacto. La preferencia de nombre de bienvenida por perfil sigue pendiente.

El diagnóstico sólo admite cuentas sintéticas nuevas, dos espacios inexistentes y confirmación antes de escribir. Verifica la copia, totales, reimportación, segundo cliente, aislamiento y soporte. La limpieza es explícita, revisa el marcador e IDs y rechaza cambios ajenos. No se cargaron datos reales.

`entregar:pruebas` limita cada operación remota mediante `--project jat-vet-pruebas`; no despliega Hosting live. Las cuentas nuevas usan UUID aleatorio, contraseñas aleatorias y custom claim sólo para el administrador sintético. Sus credenciales no se commitean ni se imprimen. El flujo debe aprobar emuladores y diagnóstico real antes de publicar, y verificar la URL después. No está verificado de punta a punta en esta sesión.
