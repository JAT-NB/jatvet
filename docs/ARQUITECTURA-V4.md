# Arquitectura implementada y límites

## Separación de la versión anterior

El HTML original permanece sin cambios. Vite incorpora su fuente como texto al adaptador `v4/legacy.js`, que reemplaza exclusivamente los puntos de carga y guardado, bloquea la importación destructiva anterior y elimina el registro de service worker dentro de V4. Las pantallas se ejecutan en un iframe sandbox de origen opaco, sin acceso al almacenamiento local ni a la sesión Firebase del contenedor. La comunicación de guardado valida origen de ventana y un token efímero. CSP limita conexiones y recursos del iframe. Ningún respaldo se importa automáticamente.

Se conservan las funciones de pacientes, responsables/mascotas, turnos, vacunas, procedimientos, estudios, servicios, caja, informes, fotos, adjuntos y exportación. El importador anterior que reemplazaba todos los datos se redirige al procedimiento revisable, para cumplir la protección solicitada. El nombre de bienvenida no se persiste en este primer adaptador; queda pendiente mover esa preferencia al perfil. El pie de página y algunas advertencias del HTML anterior siguen visibles y requieren revisión editorial posterior.

## Identidad y autorización

Firebase Authentication email/contraseña, persistencia de sesión, cierre y recuperación de contraseña. No hay registro público. El administrador es exclusivamente `gnkMytvd1KQWVagzp952Oc5qSsk1`. No se aceptan roles elegidos desde el navegador. Las reglas permiten al profesional leer/escribir su UID y al administrador asistir a otro UID. Un profesional no puede modificar perfiles ni habilitar usuarios. Un perfil `enabled:false` bloquea el acceso del profesional. Un usuario autenticado sin perfil puede usar su propio espacio.

La interfaz de administración permite seleccionar un UID, poner una etiqueta y habilitar/suspender su acceso a Firestore. **No** crea, elimina, enumera ni deshabilita cuentas de Authentication ni revoca sus tokens. Esa gestión completa necesita un backend privilegiado con Admin SDK, autorización del administrador y auditoría. No se incluyeron secretos ni un Admin SDK en el navegador.

## Persistencia de compatibilidad

`workspaces/{uid}` contiene revisión, cantidad de fragmentos y UID del actor. `workspaces/{uid}/chunks/{n}` contiene fragmentos del JSON completo del espacio. `profiles/{uid}` contiene etiqueta y habilitación. Las fotografías y adjuntos conservan sus data URLs; aún no se trasladan a Cloud Storage. Se excluye `payload` de los índices propuestos.

Es un adaptador inicial para preservar el formato y las relaciones sin reescribir de golpe toda la aplicación. Cada operación guarda una nueva revisión atómica del espacio. Los cambios simultáneos se rechazan mediante transacción: no se pisa una revisión de otro dispositivo. Un listener avisa cambios externos; el usuario recarga explícitamente para preservar formularios en edición. Se relee la revisión confirmada antes de mostrar el guardado como verificado. Esto todavía requiere pruebas con Firestore.

Las escrituras fallidas bloquean el editor y ofrecen descargar la copia pendiente en memoria. No existe cola offline durable; cerrar/recargar puede perder cambios no descargados. La aplicación advierte antes de salir. No usarla aún con información real.

Este diseño tiene costos y límites: reescribe todo el espacio, limita a **4 MB serializados por espacio** y no fusiona cambios concurrentes. El límite protege el piloto frente a los límites transaccionales; rechaza la operación completa sin recortar fotos ni borrar fuentes. Para una V4 definitiva se requiere persistencia por entidad, adjuntos en Storage con reglas equivalentes, escrituras incrementales, auditoría de soporte, borrados recuperables y pruebas de carga. No se afirma que este piloto sea la versión definitiva.

## Bloqueos externos

Firestore Emulator no pudo descargarse por la política de red. No hay login administrativo de Firebase CLI. No se conocen el UID ni una cuenta real de la hermana. No se ejecutaron despliegues ni migraciones reales. La configuración web pública no concede permisos de administración del proyecto.
