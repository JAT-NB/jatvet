## Correcciones actuales para revisión

Rama `fix/qa-seguridad-recuperacion-2026-10-21`: **109 casos, 105 PASS, 0 FAIL, 4 BLOQUEADOS**. Reglas propuestas y código corregido sin publicación. Ver [informe](INFORME-CERTIFICACION.md), [criterios aprobados](CRITERIOS-ACEPTACION.md) y [despliegue futuro](DESPLIEGUE-SEGURO.md). Los apartados siguientes conservan antecedentes históricos y no reemplazan el informe actual.

## Estado actualizado de certificación

La continuación sobre reglas actuales aportadas por el propietario está en [INFORME-CERTIFICACION.md](INFORME-CERTIFICACION.md). **85 casos: 77 PASS, 4 FAIL, 4 BLOQUEADOS. NO APTO PARA COMERCIALIZACIÓN.** De los 81 originales: 74 PASS, 3 FAIL, 4 BLOQUEADOS; se añadieron cuatro casos complementarios. La matriz con evidencias es [resultados/matriz.csv](resultados/matriz.csv). El contenido siguiente conserva antecedentes históricos; no reemplaza el informe actualizado.

# Certificación interna JAT Vet — 2026-10-21

Base auditada: c1547865e276efdd0e98d8779bc58544b7c86f76
Alcance: v4/index.html, v4/install.js, v4/sw.js, v4/manifest.webmanifest y bundles referenciados.

## Estado: NO CERTIFICADO (pendiente de evidencias)
La existencia de código no equivale a pruebas funcionales ejecutadas. No realizar cambios de producción durante la auditoría.

## Evidencias obtenidas
- Repositorio accesible y rama QA aislada: PASS.
- Manifiesto PWA: revisión estática PASS.
- Registro de service worker y actualización al pageshow: revisión estática PASS.
- Navegación desde red sin caché HTML: revisión estática PASS.
- Verificación de perfil enabled y control periódico (~12 s): revisión estática PASS.
- Control de UID para restauración: revisión estática PASS.
- Integridad de restauración real: NO EJECUTADA.
- Reglas Firestore desplegadas: NO VERIFICADAS.
- Autorización entre usuarios con tokens reales: NO EJECUTADA.
- Recuperación de contraseña extremo a extremo: NO EJECUTADA.
- Instalación/actualización Android e iOS: NO EJECUTADA.
- Pruebas de concurrencia y pérdida de conexión: NO EJECUTADAS.

## Riesgos
1. Sin reglas Firestore efectivas, no se puede acreditar aislamiento entre profesionales.
2. Código legacy utiliza localStorage: comprobar que no persista información clínica cruzada.
3. sw.js retorna Response.error() sin conexión en navegación.
4. No hay evidencia de CI para commit base.

## Criterio de liberación
100% casos críticos PASS; 0 defectos bloqueantes o altos de seguridad; prueba A/B de aislamiento; restauración y reversión probadas; verificación de despliegue contra commit; respaldo recuperable y aprobación manual.

## Ejecución adicional — 12 comprobaciones estáticas
Fecha: 2026-10-21. Se evaluó contenido obtenido del repositorio, sin abrir sesiones reales ni mutar datos.

PASS (10): manifiesto JSON; alcance PWA; registro SW; búsqueda de actualización SW; navegación no-store; etiqueta visible 4.0.1; control enabled; revalidación periódica; comprobación UID backup; presencia de validación de solapamiento.

OBSERVACIÓN (2): código legacy persiste datos con localStorage.setItem(KEY); SW devuelve Response.error() sin red. Estos hallazgos no prueban explotación ni defecto funcional, requieren casos dinámicos.

**Importante:** Los 10 PASS son de presencia/configuración estática, NO de funcionamiento extremo a extremo. Se mantiene estado NO CERTIFICADO hasta ejecutar seguridad real de Firestore, aislamiento A/B, backup/restore y pruebas móviles.

## Evidencia manual reportada — 2026-10-21
El propietario confirmó que publicó las reglas Firestore con `access(uid)` exigiendo existencia del perfil y `enabled == true`, y que pudo ingresar con las cuentas propias y de Verónica, visualizando los datos habituales en ambas. Resultado: PASS de regresión manual de acceso de dos cuentas, basado en reporte del usuario. No implica validación de denegación cross-tenant ni inspección independiente de las reglas efectivamente desplegadas.

## Evidencia manual adicional — aislamiento visual
El propietario confirmó que al alternar entre su cuenta y la de Verónica cada uno visualiza únicamente sus propias mascotas, turnos y movimientos. PASS de segregación funcional visual (declaración del usuario). PENDIENTE prueba negativa directa de reglas Firestore con identidad A intentando leer/escribir workspace B.
