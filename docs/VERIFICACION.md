# Verificación de Pulso 1.0

Fecha: 1 de octubre de 2026. Entorno local: Windows, Node.js 24.19.0, Chromium mediante Playwright 1.63.0. Los datos utilizados son ficticios.

## Comprobaciones realizadas antes de publicar

| Comprobación                    | Resultado                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Formato del código y documentos | Prettier sin diferencias                                                                                  |
| Análisis estático               | ESLint sin errores                                                                                        |
| Tipos y compilación             | TypeScript estricto y Vite completados                                                                    |
| Pruebas de lógica/proveedores   | 22 pruebas aprobadas en 4 archivos                                                                        |
| Flujos de navegador             | 12 pruebas aprobadas: 6 escenarios en escritorio y 6 en móvil                                             |
| Accesibilidad automática        | Cero infracciones en las comprobaciones axe del resumen filtrado y configuración oscura, en ambos tamaños |
| Ancho de página móvil           | 390 px de viewport y 390 px de documento; tablas desplazables en su contenedor                            |
| Inspección visual               | Capturas de escritorio y móvil revisadas                                                                  |
| Dependencias                    | Auditoría npm inicial sin vulnerabilidades reportadas                                                     |

### Flujos de navegador

1. Resumen, cambio de período, filtro de canal y conciliación visual.
2. Búsqueda escrita carácter por carácter, vacío recuperable, paginación, orden y descarga CSV.
3. Alta de venta pendiente, actualización a pagada, persistencia y recarga.
4. Búsqueda de clientes, apertura del historial, reporte y bandeja de pendientes.
5. Nombre y tema persistentes, teclado, búsqueda global y recarga de ruta.
6. Cambio de negocio y diálogo de restauración.

### Ensayo de volumen

`src/domain/scale.test.ts` crea 100,000 operaciones en memoria, calcula un resumen y obtiene una página de diez filas. Comprueba el total contra una suma independiente y que la página mantenga tamaño e IDs distintos. Informa el tiempo observado si se ejecuta con un reporter que muestre consola.

No es una prueba de concurrencia ni de infraestructura. El proveedor demo sigue siendo local. El crecimiento productivo requiere la API, base de datos, índices y pruebas descritas en la guía.

### Correcciones verificadas durante el desarrollo

- Estado local del campo de búsqueda para conservar caracteres al actualizar la URL.
- Contraste de texto secundario, avatares y posiciones del ranking.
- Nombre accesible del botón de búsqueda en móvil.
- Contención de elementos posicionados dentro de tablas: evita desbordamiento horizontal del documento.
- Tamaño adaptable del SVG para mantener legibles las etiquetas del gráfico en móvil.
- Espera de resultados asíncronos antes de comprobar el orden de una tabla.

## Reproducir

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
```

En Linux CI, la instalación usa `npx playwright install --with-deps chromium`. Para comprobar la URL publicada, definir `PULSO_BASE_URL=https://ozzy-barbosa.github.io/dashboard-base/` y ejecutar las pruebas de navegador. Cada prueba abre un contexto independiente; los cambios del demo quedan en ese contexto.

El workflow de GitHub guarda el resultado de cada ejecución en la pestaña Actions y solo despliega si la validación pasa. Las evidencias locales temporales están excluidas de Git; las capturas seleccionadas se guardan en `docs/images`.

## Límites de la evidencia

- Chromium en dos tamaños; no prueba exhaustiva de Safari, Firefox ni equipos físicos.
- axe evalúa reglas automatizables; no certifica cumplimiento WCAG ni sustituye lectores de pantalla y revisión humana.
- No hay métricas de usuarios reales ni compromiso de Core Web Vitals, disponibilidad o capacidad.
- El adaptador HTTP se prueba con respuestas simuladas; no se verificó contra un backend productivo.
- El DDL PostgreSQL es una propuesta no ejecutada. No hay base de datos, login, autorización o auditoría productiva desplegados.
- La auditoría de dependencias es una observación puntual, no una garantía futura.
