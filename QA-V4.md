# JAT Vet — QA V4.0 (rama de pruebas)

**Estado:** revisión estática completada parcialmente; pruebas de navegador pendientes. **No publicar ni borrar datos** hasta obtener respaldo verificado del dispositivo que contiene pacientes reales.

## Cambios de la rama
- Acceso a Respaldo desde Inicio, menú y navegación inferior.
- Actualización de etiquetas de versión antiguas.
- Importación: sincronizar ingresos en memoria y persistir una sola vez, con restauración de memoria ante error de almacenamiento.

## Pruebas funcionales pendientes (usar exclusivamente datos ficticios)
1. Alta de mascota y responsable; recargar página; verificar persistencia.
2. Editar mascota; añadir y quitar foto; recargar.
3. Agendar dos turnos separados por menos de 30 minutos (debe impedirse); a 30 minutos exactos (permitido).
4. Marcar turno realizado; comprobar ingreso único en Caja y total en Informes.
5. Corregir precio de turno realizado; comprobar ingreso actualizado sin duplicados.
6. Revertir turno realizado; comprobar reversión del ingreso.
7. Vacunación con fecha de vencimiento; comprobar registro y caja.
8. Adjuntar imagen y PDF pequeños a estudios; ver y descargar.
9. Exportar respaldo JSON; verificar que el archivo exista y contenga mascotas, turnos, servicios, caja y adjuntos.
10. Importar respaldo en navegador de prueba limpio; recargar y verificar persistencia.
11. Importar JSON inválido: debe rechazarlo sin alterar registros.
12. Revisar Informes por día, mes y total.
13. Repetir navegación y formularios en celular, incluida barra inferior.

## Criterio para publicar
- Todos los casos críticos aprobados en navegador real.
- Respaldo descargado y validado en el celular de la usuaria, **antes** de cambiar la versión pública.
- Confirmación expresa del usuario para publicar.

**Advertencia:** la app usa almacenamiento local del navegador, sin cuentas ni sincronización. No se deben usar datos clínicos reales sensibles en esta demo sin revisar antes la seguridad y protección de datos.
