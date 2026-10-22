# JAT Vet 4.0.2 RC1 — candidata a estable

Fecha: 21/10/2026, Argentina (evidencias técnicas UTC del 22/10). Rama: `fix/qa-seguridad-recuperacion-2026-10-21`. Código congelado y probado: `a1cccbcc6393356834126c0eec6052e42e9097fe`.

**Preparada para revisión; no desplegada. Sin certificación comercial completa.** No hubo merge, cambios productivos, reglas publicadas ni acceso a datos reales o información de Verónica.

| Matriz | PASS | FAIL | BLOQUEADOS |
|---|---:|---:|---:|
| 109 casos | 105 | 0 | 4 |

Se reejecutaron los ocho runners anteriores y un noveno específico de PWA 4.0.2: todos terminaron con código 0. Los controles complementarios de paquete/PWA no aumentan el total de casos únicos. Matriz: `qa/resultados/matriz.csv`. Resumen y comandos/commit/códigos de salida: `qa/resultados/4.0.2-rc1/resumen.json` y `exit-codes.json`.

## Contenido congelado

Sin nuevas funcionalidades. Se conservan las correcciones de seguridad, vencimientos y recuperación de `d5582a9`: fechas ISO, fin del día argentino, compatibilidad sin expiry, suspensión, fechas inválidas y control servidor. Las reglas candidatas no cambiaron y NO están publicadas. La recuperación sigue limitada a la memoria de la pestaña y la copia descargada por su propietario: cerrar, recargar o matar el navegador puede perder pendientes no descargados.

Se alinearon etiqueta visible, JSON de versión, manifiestos y marcadores SW a 4.0.2/RC1, manteniendo identidad/scope PWA. Las referencias del adaptador y módulo de sesión cambian de versión. La entrada raíz reutiliza la pantalla de desconexión aprobada en V4. No hay operaciones clínicas offline.

Los workflows históricos Firebase/Pages quedan deshabilitados en esta rama: reconstruían otra rama y podían excluir correcciones o copiar código antiguo a main. No se ejecutaron. El empaquetador usa archivos existentes; no reconstruye desarrollo ni incluye el repositorio completo en Hosting.

## Evidencias ejecutadas

Resultados nuevos en `qa/resultados/4.0.2-rc1/`:

- `firestore.json`: aislamiento, perfiles, permisos, chunks/getAfter, concurrencia y persistencia Firestore local.
- `expiry-cases.json`, `expiry-boundary.json`: vigentes/vencidos, legacy, inválidos, suspendidos y límites exactos del día argentino.
- `navegador-integrado.json`: app real con Auth 9299/Firestore 8180; guardado/recarga, backup/restauración, recuperación por propietario, revocación, cambio de usuario, cierre de sesión, desconexión y operaciones simultáneas. Descargas y capturas ficticias asociadas.
- `ejecucion.json`: 54 casos del editor real: clientes/mascotas, fotos/adjuntos, turnos, servicios, caja e informes. Adaptador con backend en memoria; persistencia real en el runner integrado.
- `offline.json`: SW V4 real, pantalla offline, bloqueo clínico y Reintentar.
- `auth-emulador.json`: Authentication demo local 9199; no entrega real de correo.
- `regresion-estatica.txt`: ocho aserciones existentes, adaptadas al SW de navegación sin caché.
- `pwa-402.json`: actualización real del controlador SW 4.0.1 → 4.0.2 en Chromium local sin recarga ni pérdida del formulario; reapertura 4.0.2; manifiesto/id/scope/iconos; eventos de instalación sintéticos e instrucciones iOS con User-Agent simulado; offline y retorno en entrada raíz.
- `empaquetado.json`: inventario, hashes, referencias HTML y generador QA-M1/QA-M2 con configuración sintética. No demuestra una app registrada ni permisos Firebase remotos.

Los emuladores escuchan solo en loopback; los runners bloquean tráfico externo de la app. El namespace local `jat-vet-pruebas` no implicó despliegue ni escritura en ese proyecto remoto. Solo usuarios y datos ficticios.

## Incidencias durante la preparación

El primer intento falló en TURN-07 y una repetición sin cambios pasó; otros intentos leyeron la corrección del turno antes de terminar la interacción y falló también su informe dependiente. Se conserva evidencia del primer intento y de intentos previos. Se estabilizó el runner esperando estado de edición tras confirmar, estado tras eliminar/revertir y render posterior al guardado. El submit se activa por teclado para evitar el desplazamiento suave del formulario. No se cambió lógica clínica para pasar los casos. La regresión final completa en el commit congelado pasó.

El botón de instalación se prueba en un fixture con `install.js` real, pues el login de la app oculta ese botón por diseño. El fixture no acredita autenticación ni instalación nativa.

## Cuatro verificaciones externas pendientes

| Caso | Qué falta |
|---|---|
| PWA-04 | Instalación real en Android Chrome e iPhone Safari. Viewport, User-Agent y eventos sintéticos no la certifican. |
| PWA-05 | Actualización de la misma instalación entre dos publicaciones QA con sesión/datos/recuperación preservados. No se publicaron esas versiones. |
| OPS-01 | Cotejo HTTPS del artefacto autorizado con el sitio publicado y su backend. La candidata aún no se desplegó. |
| AUTH-REAL-01 | Recepción y uso del correo en buzón exclusivo QA controlado, bajo autorización específica. Solo se probó el flujo emulado. |

Los cuatro siguen BLOQUEADOS, sin inferir PASS. Plan de prueba física y publicación exacta: `qa/releases/4.0.2-rc1/PLAN-PUBLICACION.md`.

## Paquete y recuperación

Paquete local: `/workspace/release-artifacts/jatvet-4.0.2-rc1/`. Inventario/hashes: `qa/releases/4.0.2-rc1/artifact.json`. Incluye ambas entradas, adaptador, SDK, CSS, módulo de sesión, PWA/iconos/config; reglas fuera de public. **Conserva el backend original y no debe usarse como preview aislada sin adaptación.** Para QA móvil usar el generador específico con config registrada/verificada de `jatvet-qa-movil-261022-a7c4`.

4.0.1 corregida y referencia histórica de main conservadas mediante archivos Git y hashes en `recuperacion-401.json`. La referencia de main no acredita el despliegue actual. Informe anterior: `qa/historico/INFORME-401-CORREGIDA.md`; evidencia anterior intacta en `qa/resultados/correcciones/` y fallo offline histórico preservado.

No volver automáticamente a reglas que permitan vencidos ni a un cliente que borre pendientes. Si no hay combinación segura comprobada, mantenimiento/hotfix autorizado. No restaurar ni limpiar datos clínicos por un incidente de Hosting. Resolver los cuatro bloqueos, revisar hashes y recibir autorización específica antes de publicar. **No se declara lista para comercialización completa.**
