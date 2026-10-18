# JAT Vet 4.0 — entorno exclusivo de pruebas

Rama: **desarrollo-v4-firebase**. Único proyecto permitido: **jat-vet-pruebas**. El HTML anterior y `main` permanecen intactos. No importar datos reales. No usar el backend, las cuentas ni el UID administrador de producción.

## Abrir y verificar localmente

Requisitos: Node 24, npm y Java 21 (Firestore Emulator). Cada tarea cloud ya está aislada; usar el checkout existente, sin worktrees salvo pedido explícito.

```sh
npm ci
npm run dev -- --port 5180 --strictPort
```

Usar la dirección que imprime Vite, rutas `/v4/` o `/v4/diagnostico.html`, en el mismo equipo. Esas rutas locales no son una preview pública. Configuración pública registrada en `public/v4/firebase-config.json`; el cliente verifica sus seis campos antes de inicializar Firebase.

```sh
npm test
npm run build
npm run test:e2e
npm run test:firebase
```

`test:e2e` requiere Vite en 5180. `test:firebase` inicia Authentication (9199), Firestore (8180), ejecuta las reglas y administra su propio Vite; esos puertos deben estar libres. En el runtime cloud usar `XDG_CONFIG_HOME=/workspace/.config` y `FIREBASE_EMULATORS_PATH=/workspace/.firebase-emulators` si los directorios personales no son escribibles. Playwright está declarado como dependencia; usa Chromium del sistema si está disponible, o su navegador instalado. La entrega instala el navegador de Playwright si hace falta.

## Único comando de entrega en un terminal con Internet

Desde esta rama, con dependencias instaladas:

```sh
npm run entregar:pruebas
```

Si no existe sesión de Firebase CLI, abre la autenticación de Google. Usa una cuenta con permisos de Firebase Authentication, reglas/índices de Firestore y Hosting **solamente en jat-vet-pruebas**. No pegar credenciales en el chat ni agregarlas al repositorio.

La entrega se detiene ante cualquier fallo. Primero valida el proyecto, la rama, las pruebas unitarias, el build y las pruebas completas con emuladores. Sólo si pasan: comprueba/crea el sitio de Hosting del proyecto de pruebas, crea tres cuentas sintéticas nuevas (administrador y dos profesionales), instala reglas e índices, ejecuta diagnóstico real con limpieza explícita de registros sintéticos, publica el canal temporal `v4-prueba` y verifica acceso administrativo en la URL. No publica Hosting live, no usa GitHub Pages y no modifica `main`.

Las credenciales aleatorias de pruebas se guardan únicamente en `.test-secrets/` (ignorado por Git, permisos restrictivos). No se imprimen las contraseñas. El administrador recibe el custom claim `jatvetAdmin:true`; no se necesita conocer ningún UID previo. No existe autoasignación de administración en el navegador. Firebase CLI sincroniza el dominio de la preview con Authentication; la prueba posterior de URL debe confirmar el acceso.

**Este flujo de entrega todavía no pudo ejecutarse de punta a punta aquí**: la descarga de Firestore Emulator recibe HTTP 403 y no hay autorización de Firebase CLI. No hay URL pública verificada. Ver [estado real](docs/PRUEBAS-V4.md).

## Instalación manual mínima de reglas

Con autorización administrativa en el proyecto de pruebas:

```sh
npx firebase deploy --only firestore:rules,firestore:indexes --project jat-vet-pruebas --config firebase.json
```

Este comando sólo instala reglas/índices; no publica una app ni concede administración a una cuenta. Preferir la entrega automatizada anterior: prueba las reglas antes de instalarlas y crea exclusivamente cuentas sintéticas con permisos de prueba.

Persistencia inicial por espacio completo, con control de revisión y límite de 4 MB. Falta convertirla en persistencia incremental y Storage para una versión definitiva. [Arquitectura](docs/ARQUITECTURA-V4.md), [diagnóstico](docs/DIAGNOSTICO-FIREBASE.md), [entrega](docs/ENTREGA-PREVIEW.md), [migración](docs/MIGRACION-V4.md).
