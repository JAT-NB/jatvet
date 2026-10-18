# Alternativa segura para validar Firebase de desarrollo

El emulador de Authentication funciona. Firestore Emulator sigue bloqueado en **esta instancia**: el proxy devuelve `CONNECT tunnel failed, response 403` al destino:

```
https://storage.googleapis.com/firebase-preview-drop/emulator/cloud-firestore-emulator-v1.22.0.jar
```

La configuración publicada sí incluye ese dominio y los de Firebase. Sin embargo, `environment_status` y `/etc/codex/network-policy.json` de esta máquina siguen describiendo la política anterior sin esos dominios. La versión publicada y la versión de la instancia son distintas. No hay que volver a crear requisitos de red ni desactivar TLS: hay que usar una instancia asociada a la versión publicada y reintentar `npm run test:rules`.

## Abrir el código sin publicarlo

En un checkout que contenga los cambios locales de `desarrollo-v4-firebase`:

```sh
npm ci
npm run dev
```

Usar la dirección que imprima Vite y la ruta `/v4/` para la aplicación, o `/v4/diagnostico.html` para el diagnóstico. Las direcciones de loopback sólo funcionan en el equipo donde se ejecuta Vite; no son una URL pública ni un enlace de preview cloud. El servidor iniciado en la máquina cloud no es accesible desde el navegador de tu computadora mediante su loopback. Los cambios siguen locales, sin push ni despliegue.

## Validar desde una computadora con acceso a Firebase

Esta página de diagnóstico está implementada y compilada; **no se ejecutó contra Firebase real**. Sus protecciones se probaron con repositorios en memoria. Las mismas verificaciones están añadidas a la suite de integración del emulador, todavía bloqueada.

1. Confirmar que `jat-vet` se puede usar como proyecto de desarrollo. Si comparte datos o reglas con otra aplicación, crear primero un proyecto independiente y adaptar explícitamente la configuración y la validación de projectId; no abrir reglas globalmente.
2. Un administrador autorizado crea dos cuentas nuevas de Authentication cuyos correos comiencen con `jatvet-v4-test-` o `jatvet-v4-test+`. No usar la cuenta de la hermana ni cuentas con datos previos. La herramienta no crea ni elimina cuentas de Authentication.
3. Revisar las reglas remotas existentes antes de cualquier cambio. La herramienta **no despliega reglas**. Si las reglas actuales rechazan las rutas nuevas, informar `permission-denied`, revisar el diff y autorizar por separado una actualización limitada; no usar reglas abiertas ni sobrescribir políticas ajenas.
4. Habilitar email/contraseña y autorizar el dominio local que se use para las pruebas según la configuración de Authentication. No deshabilitar verificaciones para evitar un error.
5. Abrir `/v4/diagnostico.html` localmente. Ingresar las credenciales directamente en esa página, sin pegarlas en chat, archivos ni scripts. Las sesiones son sólo en memoria; los campos de contraseña se vacían al comenzar y no se incluyen en los resultados.
6. Marcar la confirmación de uso de `jat-vet` como desarrollo y pulsar «Iniciar verificación explícita». Se exige el UID conocido del administrador y dos UIDs profesionales distintos. El preflight exige que **ambos espacios no existan**; cualquier espacio previo cancela sin escrituras.
7. El diagnóstico crea un respaldo sintético con fotos y adjuntos pequeños, verifica la lectura exacta y los totales, la reimportación sin duplicados, una segunda sesión independiente, el rechazo de lectura y escritura entre usuarios, el acceso de soporte del administrador, una edición y el espacio propio de B. El espacio real del administrador nunca se escribe. Ningún respaldo real puede cargarse en esta herramienta.
8. Revisar los resultados. Un error de conexión no cuenta como rechazo de permisos aprobado. La herramienta se detiene en el primer fallo; no limpia datos automáticamente. Si se detiene tras una escritura, revisar sólo los espacios de las cuentas sintéticas; no volver a probar con cuentas reales.
9. Si finaliza correctamente, el botón de limpieza verifica el identificador de ejecución y los IDs antes de vaciar **únicamente** los registros sintéticos. Si encuentra datos ajenos o un cambio concurrente, se detiene. Conserva los documentos raíz, por lo que una nueva ejecución requiere otro par de cuentas nuevas. Cerrar las sesiones con el botón correspondiente.

El diagnóstico en Firebase real puede generar consumo facturable, limitado a unos pocos documentos de cuentas sintéticas. La sincronización comprueba dos clientes Firebase independientes en el mismo navegador; queda pendiente la prueba en dos dispositivos físicos. No equivale a validar todo el flujo de migración de un respaldo real ni las pantallas completas contra Firestore.

## Qué aún impide una URL pública

No se publicaron la aplicación ni las reglas. Un canal nuevo de Firebase Hosting sigue necesitando acceso CLI autorizado, validación de las reglas y autorización explícita de publicación. No se alteró GitHub Pages ni `main`. La configuración pública web por sí sola no autoriza despliegues.
