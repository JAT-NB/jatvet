# JAT Vet 4.0 — desarrollo aislado

Rama de trabajo: `desarrollo-v4-firebase`. `index.html` y `acceso-prueba.html` permanecen intactos respecto de `80d0575`. No se desplegó ni se modificó `main` ni GitHub Pages. La entrada nueva es `/v4/`.

## Desarrollo

Requisitos verificados: Node 24, npm 11, Python 3.12 y Chromium 154. Java 21 para Firestore Emulator. Cada tarea cloud ya está aislada: usar el checkout existente, sin crear worktrees salvo pedido explícito.

```sh
cd /workspace/jatvet
npm ci --cache /workspace/.npm-cache
npm run dev -- --port 5173 --strictPort
npm test
npm run build
npm run test:e2e
```

`test:e2e` usa Playwright instalado en el runtime cloud y Chromium en `/usr/bin/chromium`. Para otra máquina, instalar Playwright como herramienta de pruebas y configurar esa ruta. Vite debe estar ejecutándose para esa suite. Los tests usan contextos de navegador descartables, datos sintéticos y no tocan respaldos del usuario.

La configuración web pública registrada de `jat-vet` está en `public/v4/firebase-config.json` y se copia al build. No es una credencial de administrador. Nunca incorporar contraseñas, claves privadas ni archivos de cuentas de servicio. La autorización depende de Authentication y de las reglas de Firestore, que todavía no fueron desplegadas ni verificadas con el emulador.

## Pruebas con emuladores

```sh
cd /workspace/jatvet
XDG_CONFIG_HOME=/workspace/.config FIREBASE_EMULATORS_PATH=/workspace/.firebase-emulators npm run test:rules
```

Ese comando descarga Firestore Emulator desde `storage.googleapis.com`. La política cloud actual impidió descargarlo. Se guardaron los dominios requeridos en el borrador del entorno; deben aplicarse desde la configuración antes de reintentar. Nunca desactivar verificaciones TLS, firmas ni checksums.

Para la prueba de acceso con Authentication Emulator, mantener Vite en otro terminal:

```sh
XDG_CONFIG_HOME=/workspace/.config FIREBASE_EMULATORS_PATH=/workspace/.firebase-emulators npx firebase emulators:exec --only auth --project jat-vet 'JAT_TEST_AUTH=1 npm run test:e2e'
```

La suite crea únicamente en `127.0.0.1:9099` cuentas sintéticas `admin@example.test` y `vet@example.test`. El UID del segundo es un fixture y **no** representa a la hermana del titular. `?emulators=1` sólo funciona en localhost/127.0.0.1 y conecta ambos SDK a emuladores locales; fuera de esos hosts no activa ese modo. No usar credenciales reales en el emulador. La suite de reglas usa un proyecto `demo-jat-vet` independiente.

## Entrega de prueba: pendiente, sin publicación

No existe todavía una URL publicada de V4. Antes de crear un canal de Hosting:

1. Habilitar y ejecutar la suite de Firestore; corregir cualquier fallo.
2. Obtener acceso autorizado al proyecto mediante Firebase CLI, sin compartir secretos en chat.
3. Revisar las reglas remotas existentes y combinar los cambios sin bloquear aplicaciones previas. El archivo local deniega rutas ajenas: no reemplazar reglas remotas a ciegas.
4. Validar Authentication (email/contraseña y dominios autorizados), Firestore e índices con cuentas de prueba autorizadas. No se dispone de las contraseñas de usuarios reales ni se necesitan para implementar.
5. Obtener autorización explícita de publicación. Crear un canal nuevo y temporal, por ejemplo `v4-prueba`, mediante `firebase hosting:channel:deploy v4-prueba --project jat-vet --expires 7d`. Esto **publica** una preview; no ejecutarlo antes de la autorización. Confirmar el sitio de Hosting de destino, la URL devuelta y su dominio autorizado en Authentication. No usar un deploy de Hosting a live ni modificar GitHub Pages.
6. Verificar la URL real en escritorio y celular y adjuntar los resultados. Una preview usa el mismo backend configurado: no implica una base de datos aislada.

No fusionar ni publicar en producción sin aprobación. Ver [arquitectura](docs/ARQUITECTURA-V4.md), [migración](docs/MIGRACION-V4.md) e [informe real de pruebas](docs/PRUEBAS-V4.md).

## Revalidación tras publicar la configuración cloud

Se confirmó que la versión publicada incluye los dominios, pero esta instancia sigue con la política anterior y devuelve un 403 del proxy al descargar Firestore Emulator. Ver [diagnóstico de Firebase](docs/DIAGNOSTICO-FIREBASE.md) para la evidencia y para usar la nueva página `/v4/diagnostico.html` sin publicar la aplicación. Esa página exige cuentas sintéticas nuevas y confirmación antes de realizar solicitudes a Firebase; no se ejecutó contra el servicio real.
