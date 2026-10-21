# Correcciones JAT Vet 4.0.1 para revisión

**109 casos: 105 PASS, 0 FAIL y 4 BLOQUEADOS.** Rama separada `fix/qa-seguridad-recuperacion-2026-10-21`, basada en la certificación anterior. Ningún merge, despliegue, regla publicada ni dato real modificado.

- SEC-05: vencimiento servidor con día inclusivo Argentina; compatibilidad de perfiles sin expiry/vacío; fechas inválidas y suspensión denegadas.
- DATA-04 / DATA-04-REVOKE: copia pendiente por UID, recuperación por propietario sin reactivar acceso, bloqueo offline y preservación ante conflicto, logout y cambio de identidad. La copia en memoria exige descargar antes de cerrar/recargar la pestaña.
- PWA-03: criterio actualizado a Internet obligatorio y vuelto a ejecutar. SW y pantalla de desconexión existentes conservados; evidencia anterior del fallo archivada.
- Regresión completa con emuladores, restauración/fotos, concurrencia, fechas de frontera y ausencia de errores JS no controlados.

Reglas propuestas: qa/firestore/firestore.proposed.rules. Código de sesión: v4/app-session.js. Evidencias: qa/resultados/correcciones/. Publicación posterior requiere autorización y seguir qa/DESPLIEGUE-SEGURO.md; los workflows actuales leen otra rama y no deben ejecutarse sin revisar su fuente.

Siguen bloqueados dispositivos reales, actualización instalada, comparación del sitio público por red y entrega real de correo autorizada. La certificación comercial final sigue pendiente de esas pruebas.
