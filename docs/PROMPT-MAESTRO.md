# Prompt maestro ejecutado · Pulso

Fecha: 1 de octubre de 2026. Instrucción adaptada para este proyecto, basada en P01 de la biblioteca del usuario y las skills L01, L07 y L09. Los originales de terceros no se redistribuyen.

## Encargo

Diseña, implementa, prueba y publica un dashboard web reutilizable para futuros negocios. Crea un prototipo funcional en español (México), con MXN, accesible, adaptable a móvil y escritorio, con una identidad visual sobria y cuidada llamada Pulso. La carpeta de partida está vacía. La publicación autorizada es un repositorio público dashboard-base en la cuenta de GitHub disponible y su GitHub Pages.

## Contexto y límites confirmados

- Es una base para varios tipos de negocio, no un sistema productivo de un cliente existente.
- Volumen real, concurrencia, presupuesto futuro, SLA y equipo de mantenimiento: por definir con cada cliente. No inventarlos ni prometer capacidad sin ensayos.
- Datos, clientes y operaciones de ejemplo deben identificarse como ficticios.
- GitHub Pages ejecuta el frontend; identidad, autorización, secretos y datos privados requieren una API externa.
- No se solicitan integraciones externas, pagos, correos ni recursos de pago.

## Skills y método

1. Aplica P01 para concretar alcance, flujos, aceptación, implementación y evidencia.
2. Aplica L01 para decisiones, alternativas, diagrama y crecimiento por etapas. No agregues colas ni caché distribuida sin necesidad medida.
3. Aplica L07 para proponer un modelo relacional e índices por negocio; distingue el diseño propuesto de infraestructura implementada.
4. Aplica L09 para explicar el código real, ejemplos, instalación, operación, errores previsibles y adaptación.
5. Usa React Best Practices para límites de componentes, cargas diferidas, estados derivados, concurrencia de solicitudes y persistencia versionada.
6. Usa las skills de verificación de navegador para observar la interfaz, probar flujos y corregir defectos.

## Alcance de implementación

Resumen con indicadores calculados y comparación con período anterior; tendencia de ingresos; desglose por canal; productos destacados; actividad reciente; ventas buscables, ordenables y paginadas; detalle y cambios de estado; alta de una venta; clientes derivados de operaciones; reportes CSV; configuración de identidad, tema y metas; varios perfiles de negocio de demostración.

Filtros coherentes de período y canal, estados de carga/error/vacío recuperables, teclado, foco visible, etiquetas, alternativas textuales para gráficos y respeto a movimiento reducido. Persistencia local acotada para cambios del demo, nunca secretos. Dinero en centavos enteros y fechas sin ambigüedad. CSV protegido contra fórmulas.

## Arquitectura

React + TypeScript + Vite. Contrato de proveedor de datos independiente de las vistas, implementación demo sustituible por HTTP con validación de respuestas. Consultas con caché, cancelación y claves completas. Tablas con paginación en el proveedor; agregaciones fuera de componentes. Paginación remota e índices en producción. Rutas hash compatibles con Pages y despliegue reproducible con CI.

## Criterios de aceptación

- Ninguna cifra de UI sin fuente calculada o etiqueta de ejemplo.
- Cada acción visible funciona y comunica su resultado.
- Filtros afectan KPI, gráficos, tablas y exportaciones según el alcance explicado en pantalla.
- Pruebas de cálculos, intervalos, validación, exportación y aislamiento entre perfiles.
- Navegador: crear venta, cambiar estado, buscar, filtrar, paginar, exportar, navegar, configurar y recargar; comprobar móvil, teclado y accesibilidad automática.
- Construcción y comprobaciones pasan antes de publicar. Verificar URL pública y despliegue del commit final.
- Entregar README y guía de estudio del código, investigación enlazada, contrato API y plan concreto para pasar a producción.

## Entrega

Código editable, prompt ejecutado, sitio público verificado, documentación en Markdown y evidencia proporcionada de pruebas. Identificar claramente implementado, propuesto y pendiente de validación con datos/carga reales.
