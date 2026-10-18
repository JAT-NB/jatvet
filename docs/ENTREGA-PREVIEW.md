# Entrega exclusiva de pruebas

Proyecto único: **jat-vet-pruebas**. Rama única de trabajo: **desarrollo-v4-firebase**. No modificar `main`, publicar sobre una URL existente de producción ni importar datos reales.

No hay una URL pública verificada. La comprobación de sólo lectura `firebase hosting:sites:list --project jat-vet-pruebas --json` responde `Failed to authenticate, have you run firebase login?`. La descarga oficial de Firestore Emulator sigue rechazada por el proxy con HTTP 403. La configuración web pública no concede permisos administrativos.

## Un comando que reúne la preparación y publicación

En un checkout de esta rama, con Node 24, Java 21 y dependencias instaladas, desde un terminal con Internet:

```sh
npm run entregar:pruebas
```

Autorizar Google cuando lo solicite, exclusivamente con permisos sobre `jat-vet-pruebas`. Es el único acceso que no puede concederse autónomamente. El script no publica si fallan las pruebas de emulador o el diagnóstico de persistencia/aislamiento real. Si el terminal comparte la restricción de red de esta instancia, se detendrá antes de escribir en Firebase; usar un equipo con acceso efectivo a los servicios oficiales. No volver a publicar ajustes idénticos ni deshabilitar verificaciones TLS.

Pasos automáticos: confirmar rama y configuración, pruebas unitarias/build, emuladores y E2E, autenticación CLI si falta, confirmar/crear sitio del proyecto de pruebas, importar únicamente tres cuentas sintéticas nuevas con UUID y contraseñas aleatorias, instalar reglas e índices, diagnóstico real y limpieza de registros sintéticos, canal temporal `v4-prueba` por 7 días, y prueba del acceso administrativo en la URL final. Los archivos de credenciales quedan sólo en `.test-secrets/`, ignorados por Git y con permisos restrictivos. No hay UID de producción en el código.

`firebase.preview.json` despliega sólo Hosting de pruebas; `.firebaserc` vincula el target únicamente al proyecto de pruebas. La raíz de la preview redirige a `/v4/`. Ningún comando del flujo despliega Hosting live. Las reglas e índices se instalan mediante un comando separado con el proyecto fijado a pruebas. Firebase CLI intenta registrar el dominio del canal en Authentication; la comprobación posterior debe confirmar que funciona.

El flujo está implementado, pero **no se ejecutó hasta obtener una URL** en esta sesión. Los resultados reales están en `PRUEBAS-V4.md`; los pendientes de Firestore no están aprobados por inspección.
