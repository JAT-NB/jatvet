# JAT Vet — QA de cinco mejoras visuales (23/10/2026)

**Estado:** rama de trabajo; no publicar ni fusionar a main sin aprobación.

## Alcance
1. Login: revisar distribución, tipografía, logo, teclado móvil, usuario recordado y primer ingreso.
2. Recuperación de contraseña: feedback visible, accesible y claro para éxito/error; evitar solicitudes duplicadas.
3. Pantalla inicial: evitar parpadeos de login durante la inicialización y sin ocultar errores indefinidamente.
4. Regreso desde segundo plano: comprobar restauración visual, foco, sesión y datos sin duplicaciones.
5. Actualización disponible: aviso visible, opción Actualizar ahora y recuperación tras instalar la nueva versión.

## Aislamiento y seguridad
- No cambiar Firebase, Authentication, Firestore, reglas, UID ni respaldos de usuarios reales.
- No publicar assets compartidos de producción ni modificar main.
- Los ensayos que requieren autenticación o escritura deben ejecutarse en un entorno QA con datos ficticios y configuración aislada, **nunca en la cuenta de la hermana**.
- Validar Android Chrome, iPhone Safari/PWA y escritorio; probar sesión nueva y sesión recordada.

## Criterios de salida
- Pruebas funcionales, visuales y regresión completadas.
- Evidencia de captura o video de cada cambio.
- Aprobación explícita del propietario antes de cualquier merge.
