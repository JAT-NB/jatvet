# Resultados reales — Firebase independiente de pruebas

Proyecto: `jat-vet-pruebas`. Rama: `desarrollo-v4-firebase`. Resultados del 17 de octubre de 2026 (America/Buenos_Aires). No se conectó el código adaptado al backend de producción, no se modificaron los archivos HTML originales y no se importaron datos reales.

## Aprobadas

- 17 pruebas unitarias: 7 de datos/migración, 6 de protección del diagnóstico y 4 de configuración exclusiva/permiso administrativo. Cero fallidas y omitidas.
- Compilación Vite completa con la configuración pública nueva.
- Authentication Emulator aislado en 9199 para el proyecto de pruebas: inicio y cierre de administrador sintético con custom claim y profesional sin claim, contraseña incorrecta y recuperación emulada. No se usó el UID administrativo previo.
- Navegador Chromium en escritorio (1366×900) y tamaño celular (390×844): alta de paciente, reapertura desde copia de memoria, ocho secciones, alta/edición/eliminación de servicio y ausencia de excepciones de JavaScript en los recorridos.
- localStorage anterior intacto en las pruebas.
- Descarga JSON real desde iframe: coincidencia exacta con el respaldo sintético, incluidas fotos, adjuntos, relaciones y totales.
- Diagnóstico sin solicitudes Firebase antes del consentimiento.

La reapertura local, el repositorio en memoria y los tests de JSON **no demuestran persistencia en Firestore**. La recuperación emulada no demuestra entrega real de correo. El viewport móvil no sustituye un teléfono físico.

## Intentadas pero bloqueadas

- `npm run test:rules`, dirigido a `jat-vet-pruebas`: no se ejecutaron los seis casos porque falló la descarga oficial de `cloud-firestore-emulator-v1.22.0.jar`. Petición de diagnóstico: `CONNECT tunnel failed, response 403` a `storage.googleapis.com`. No se cambió TLS, no se cambió el checksum ni se usaron mirrors.
- `npm run test:firebase`: se intentó, pero el emulador Authentication de esta misma sesión ya ocupaba 9199. Se comprobó Firestore por separado para aislar la causa de red. El procedimiento de entrega requiere puertos 9199/8180/5180 libres.
- Firebase Hosting de pruebas: `hosting:sites:list --project jat-vet-pruebas --json` devuelve `Failed to authenticate, have you run firebase login?`. No hay identidad administrativa configurada.

## Preparadas, todavía no verificadas

- Seis casos de reglas e integración: CRUD, aislamiento profesional/anónimo, administración por claim, no escalamiento de permisos, migración sintética con limpieza, revisión y listener de segundo cliente.
- E2E completo con Firestore Emulator: creación, revisión de importación, guardado, recarga, exportación exacta, segundo cliente y espacio propio de B.
- Diagnóstico sobre Firestore real del proyecto de pruebas.
- Instalación remota de reglas/índices, creación de cuentas sintéticas y canal de Hosting, y verificación de la URL final. El flujo automatizado se detiene antes de estas escrituras si las pruebas no pasan.

## Correcciones de esta adaptación

Se reemplazó la configuración Firebase; se centralizó la validación estricta de los seis campos registrados; se sustituyó el UID fijo por el claim `jatvetAdmin:true`; se fijaron proyecto y audience en reglas; se aislaron puertos de emuladores para evitar usar instancias anteriores. La primera ejecución de Authentication detectó una instancia previa en el puerto viejo; se corrigió a 9199 y la ejecución final pasó con el proyecto y claims nuevos.

La cuenta administrativa real de pruebas no está provisionada: el flujo de entrega crea únicamente un administrador sintético nuevo, sin solicitar un UID al usuario. Faltan permisos administrativos de Firebase para ejecutar ese flujo aquí. Sigue vigente el límite de 4 MB del almacenamiento piloto, la falta de Storage incremental y la administración incompleta del ciclo de vida de cuentas. No se declara una versión definitiva terminada.
