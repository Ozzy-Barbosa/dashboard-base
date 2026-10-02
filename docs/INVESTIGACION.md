# Investigación y decisiones aplicadas

Fecha de consulta: 1 de octubre de 2026. Se priorizaron documentos oficiales y decisiones comprobables. “Excelente” se tradujo en criterios de uso, exactitud, mantenimiento y crecimiento; no en una garantía universal.

## Fuentes y consecuencias

| Tema                  | Fuente primaria                                                                                                                | Decisión en Pulso                                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Accesibilidad         | [W3C: WCAG 2.2](https://www.w3.org/TR/WCAG22/) y [foco visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance/) | Controles con nombre, foco visible, navegación por teclado, diálogo nativo, color acompañado de texto, tablas semánticas y movimiento reducido.                                                        |
| Caché y recuperación  | [TanStack Query: Important Defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)         | Datos frescos durante 60 s; limpieza de consultas inactivas a los 5 min; un reintento de lectura y ninguno automático de escritura. Actualización manual.                                              |
| Paginación            | [TanStack Query: Paginated Queries](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries)           | Claves con negocio, período, canal, búsqueda, estado, orden y página. La tabla recibe una página limitada desde el proveedor.                                                                          |
| Permisos              | [OWASP: Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)              | Documentar comprobación de permisos en cada solicitud del backend; no tratar filtros ni ocultación de botones como barrera de seguridad.                                                               |
| Crecimiento de datos  | [PostgreSQL: Multicolumn Indexes](https://www.postgresql.org/docs/current/indexes-multicolumn.html)                            | Proponer índices que empiezan por negocio y siguen por las columnas de consulta. Medir planes antes de añadir más índices.                                                                             |
| Despliegue            | [Vite: Static Deploy](https://vite.dev/guide/static-deploy)                                                                    | Base `/dashboard-base/`, compilación reproducible y carga de `dist` a GitHub Pages mediante Actions.                                                                                                   |
| Alcance de Pages      | [GitHub: What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)       | Alojar el frontend y la demostración. Los servicios privados y las operaciones de base de datos requieren infraestructura adicional.                                                                   |
| Rendimiento percibido | [Google: Web Vitals](https://web.dev/articles/vitals)                                                                          | Rutas diferidas, gráficos SVG pequeños y tipografías locales. Objetivos futuros de campo: LCP ≤ 2.5 s, INP ≤ 200 ms y CLS ≤ 0.1 en p75. No confundir una prueba local con medición de usuarios reales. |

## De las necesidades a la implementación

| Necesidad                  | Implementación                                                 | Cómo se comprueba                                               |
| -------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------- |
| Entender el negocio rápido | Cuatro KPI, tendencia y desglose por canal                     | Cifras conciliadas con el mismo conjunto filtrado               |
| Saber qué hacer después    | Pendientes enlazados a ventas y meta editable                  | Navegación y filtro en navegador                                |
| Encontrar una operación    | Búsqueda normalizada, filtro de estado, orden y paginación     | Escritura rápida, resultados vacíos, siguiente página           |
| Operar con confianza       | Validación y errores visibles; datos ficticios identificados   | Casos inválidos, almacenamiento fallido, 401 y contrato erróneo |
| Compartir información      | CSV con BOM, comillas y neutralización de fórmulas             | Pruebas de serialización y descargas reales                     |
| Adaptar el producto        | Perfiles, variables CSS, preferencias, proveedor de datos      | Cambio de negocio, tema, persistencia y API simulada            |
| Mantenerlo                 | TypeScript estricto, funciones de dominio, formato y CI        | Comprobación de tipos, reglas estáticas y pruebas               |
| Crecer                     | Contrato paginado, respuestas validadas, límite de exportación | Ensayo de lógica con 100,000 filas; plan de backend documentado |

## Cinco decisiones de arquitectura

1. **SPA con React y Vite.** El producto tiene mucha interacción y pocos requisitos de contenido indexable. Evita introducir un servidor de renderizado en un prototipo estático. A cambio, los servicios productivos deben añadirse aparte.
2. **Proveedor de datos sustituible.** Las pantallas dependen de un contrato tipado. La alternativa de importar arrays directamente en cada vista sería más corta, pero acoplaría la UI al demo.
3. **Consultas por página y agregados separados.** Las vistas no requieren descargar el histórico entero. El demo calcula localmente; la implementación HTTP permite mover el trabajo a consultas de servidor.
4. **SVG para dos visualizaciones concretas.** Evita una biblioteca gráfica general para necesidades pequeñas. El coste es mantener el código del gráfico y sus equivalentes accesibles.
5. **Despliegue condicionado a pruebas.** GitHub Actions instala versiones fijadas, verifica y publica. A cambio, cada publicación toma más que una copia manual de archivos.

No se añadieron colas, Redis, microservicios, Kubernetes ni un almacén analítico al prototipo. Se incorporarán solo si un perfil de carga y requisitos reales lo justifican.

## Recursos de la biblioteca usados

Se consultó el índice local recordado en memoria y después se leyeron los originales completos. P01 guio el alcance y verificación; L01, arquitectura; L07, modelo relacional; L09, documentación. También se aplicaron React Best Practices y las skills de verificación de navegador disponibles en el entorno.

Los recursos L01/L07/L09 son plantillas documentales de IA Skills versión 1. No se presentan como software instalado ni como garantía de calidad. Las instrucciones se adaptaron al alcance confirmado, dejando volumen real, equipo, presupuesto y SLA por definir. Se conserva un prompt original del proyecto, sin copiar las plantillas de terceros al repositorio.
