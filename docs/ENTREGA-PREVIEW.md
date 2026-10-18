# Entrega de prueba: bloqueos comprobados

El código está en la rama de desarrollo `desarrollo-v4-firebase`. Se guarda como un commit separado, sin cambiar el commit de `main` ni los archivos originales `index.html` y `acceso-prueba.html`. No se migraron datos reales.

## Estado de publicación

No se obtuvo una URL pública funcional. Hay dos bloqueos independientes:

1. **Sin autorización de Firebase CLI para administrar Hosting.** La operación de sólo lectura `firebase hosting:sites:list --project jat-vet --json` devuelve exactamente `Failed to authenticate, have you run firebase login?`. La configuración web de Firebase no concede permisos de despliegue. Se necesita una conexión autenticada de Google/Firebase con permisos para consultar el sitio y crear versiones en un canal de prueba. Configurar la identidad por un mecanismo seguro del entorno, nunca pegando tokens, contraseñas ni claves privadas en chat o repositorio.
2. **Validación de Firestore pendiente.** El proxy de esta instancia devuelve `CONNECT tunnel failed, response 403` al descargar `https://storage.googleapis.com/firebase-preview-drop/emulator/cloud-firestore-emulator-v1.22.0.jar`. La configuración publicada incluye el dominio, pero la máquina sigue vinculada a la versión anterior, con `allowed_hosts: []`. Crear/reconectar una instancia vinculada a la versión publicada y ejecutar la suite de reglas, o ejecutar el diagnóstico controlado en un equipo con acceso a Firebase. No se exige volver a publicar los mismos permisos.

## Pruebas

Se volvieron a ejecutar las 13 pruebas unitarias y el build: aprobados. Los recorridos de escritorio/celular y Authentication Emulator se aprobaron en la revalidación previa, sin cambios posteriores en el código de autenticación. No se autenticó la cuenta real del administrador. Las 6 pruebas de Firestore siguen sin ejecutarse; no están aprobadas por inspección del código. Es necesario demostrar lecturas y escrituras propias, denegación entre usuarios y anónimos, soporte administrativo, migración sintética y rechazo de conflictos, antes de usar esta preview con Firebase de desarrollo.

Las reglas remotas existentes no fueron leídas ni modificadas. Revisarlas y compararlas antes de considerar un despliegue de reglas: la configuración local no debe reemplazar políticas existentes a ciegas. Para pruebas reales usar sólo cuentas sintéticas nuevas y datos sintéticos; no usar el UID de la hermana ni migrar su respaldo. Procedimiento detallado en `DIAGNOSTICO-FIREBASE.md`.

## Publicación aislada cuando se resuelvan los bloqueos

Se preparó `firebase.preview.json`, que contiene sólo Hosting, sin despliegue de reglas ni índices. Exige un target explícito `v4-preview`, para no elegir silenciosamente un sitio. Redirige la raíz a `/v4/`. El sitio de destino debe confirmarse con la operación de lectura anterior y mantenerse independiente de GitHub Pages.

Con una sesión autorizada y las pruebas pendientes aprobadas:

```sh
npm ci
npm test
npm run test:rules
npm run build
```

Confirmar el ID real del sitio de Hosting y asociarlo al target `v4-preview` mediante `firebase target:apply hosting v4-preview ID_DEL_SITIO_VERIFICADO --project jat-vet`. La asociación es configuración local; no se debe inventar el ID ni copiar literalmente ese marcador.

Luego crear sólo el canal temporal:

```sh
npx firebase hosting:channel:deploy v4-prueba --project jat-vet --config firebase.preview.json --expires 7d
```

Esta orden publica la **preview** autorizada, no el canal live. No ejecutar `firebase deploy`, no desplegar reglas con esta operación, no fusionar en `main` y no cambiar GitHub Pages. Registrar la URL real devuelta por Firebase, verificarla con navegador y confirmar que su dominio está autorizado en Authentication. Una preview de Hosting comparte el backend configurado: no convierte Firestore en una base aislada.

Hasta entonces, la aplicación y el diagnóstico pueden abrirse desde un checkout local con `npm ci` y `npm run dev`, utilizando las rutas `/v4/` y `/v4/diagnostico.html` en la dirección que imprime Vite. Eso no es una URL pública de entrega.
