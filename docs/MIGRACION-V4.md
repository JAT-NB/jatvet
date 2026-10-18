> En esta entrega sólo se permiten respaldos sintéticos en jat-vet-pruebas. El procedimiento de migración real descrito abajo queda pospuesto y requiere autorización futura; no ejecutarlo con datos de la hermana.

# Migración manual, revisable y aditiva

No se ejecutó ninguna migración real. No hay UID asignado ni inventado para la hermana.

1. Crear su cuenta real en Firebase Authentication mediante un administrador autorizado; obtener y verificar su UID. No enviar contraseñas al repositorio ni al chat.
2. Conservar la aplicación anterior y exportar su JSON. Guardar al menos dos copias del archivo, sin modificar sus datos locales.
3. Cuando las reglas y pruebas de Firebase estén validadas, ingresar como titular o abrir desde soporte el UID confirmado. Evitar operaciones simultáneas desde otros dispositivos durante la importación.
4. Elegir el archivo en «Importar respaldo anterior». La selección no escribe en Firebase. Revisar UID, revisión, cantidades por colección, totales de ingresos/gastos, número de fotos y de adjuntos.
5. Confirmar explícitamente la titularidad y la importación. Se agregan registros con IDs nuevos. IDs ya presentes con contenido idéntico se omiten. Un mismo ID con contenido distinto bloquea toda la operación, incluyendo conflictos de metadatos; no se sobrescribe. No se deduplican automáticamente personas con distintos IDs para evitar unir pacientes diferentes.
6. Los IDs y referencias originales se conservan. Se rechazan referencias rotas, IDs duplicados, caja inválida y adjuntos no compatibles. Estos errores requieren revisión del respaldo original; el importador nunca los repara eliminando registros.
7. El guardado usa una transacción con control de revisión, seguido de lectura y comparación de datos y totales. Si otro dispositivo escribe, se rechaza el guardado o la verificación para revisión manual. Descargar cualquier copia pendiente ante un error.
8. Exportar el resultado desde V4, compararlo con la vista previa y verificar pacientes representativos, fotos, estudios, vacunas y movimientos. Reabrir desde un segundo dispositivo. Mantener el respaldo original y la versión anterior hasta la aceptación expresa del titular.

Límite actual: 4 MB serializados por espacio. Los respaldos mayores se rechazan completos, sin truncarlos. No dividir manualmente un respaldo con referencias entre entidades: la solución pendiente es el almacenamiento incremental y Storage. Las pruebas automáticas usaron datos sintéticos; la compatibilidad con el respaldo real queda pendiente de revisión autorizada.
