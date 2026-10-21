Certificación ampliada: **85 casos, 77 PASS, 4 FAIL y 4 BLOQUEADOS**. De los 81 originales: 74 PASS, 3 FAIL y 4 BLOQUEADOS. Se resolvieron 16 de los 20 bloqueos iniciales (14 PASS, 2 FAIL) y se añadieron cuatro casos complementarios.

Reglas actuales copiadas de Firebase por el propietario, sin cambios de lógica. Auth y Firestore emulados con usuarios/datos ficticios. PASS de aislamiento A/B, perfiles, permisos, chunks/getAfter, persistencia, concurrencia y restauración con fotos/adjuntos.

FAIL: suscripciones vencidas conservan acceso; desconexión prolongada elimina recuperación de pendientes; revocación durante guardado oculta la copia que promete conservar; uso de la aplicación tras recarga offline. El aviso offline y Reintentar funcionan; se corrigió el diagnóstico anterior sobre Response.error().

BLOQUEADOS: instalación Android/iOS, actualización en dispositivos, comparación del despliegue por red y entrega real de correo prohibida por alcance. Evidencias en qa/resultados/matriz.csv y qa/resultados/continuacion/. Propuestas sin cambios productivos en qa/PROPUESTA-CORRECCIONES.md.

**NO APTO PARA COMERCIALIZACIÓN.** No se modificó producción ni se hizo merge o despliegue; solo datos ficticios.
