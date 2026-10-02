# Contrato de integración HTTP

Estado: **cliente implementado y probado con respuestas simuladas; servidor no implementado ni desplegado**.

El contrato autoritativo del frontend está en `src/domain/models.ts` (Zod), `src/data/provider.ts` (interfaz) y `src/data/http.ts` (transporte). Las siguientes rutas son las que ese cliente invoca, relativas a `VITE_API_URL`.

## Configuración

```dotenv
VITE_DATA_MODE=api
VITE_API_URL=https://api.tu-negocio.example/v1/
```

`VITE_*` se incorpora al JavaScript público. No colocar tokens de administrador, contraseñas ni claves privadas. La dirección debe usar HTTPS, salvo localhost en desarrollo. El modo API usa el día actual en `America/Mazatlan`; el demo conserva una fecha fija para ser reproducible.

El cliente envía `credentials: include`. Antes de activarlo, implementar inicio de sesión, cookies `HttpOnly; Secure`, expiración y permisos. Si la API está en otro origen, configurar CORS únicamente para el frontend autorizado, credenciales y protección CSRF. Verificar políticas de cookies del navegador: una API en otro sitio puede requerir un dominio compartido o BFF. No basta con cambiar estas variables.

## Parámetros compartidos

| Campo          | Tipo       | Regla                                                                                                                                                                                     |
| -------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `businessId`   | string     | IDs demo actuales: comercio, servicios, cafeteria. Para clientes reales, adaptar esquema y configuración a sus IDs. El servidor valida pertenencia independientemente del valor recibido. |
| `start`, `end` | YYYY-MM-DD | Límites inclusivos por fecha de negocio; establecer máximo de intervalo en servidor.                                                                                                      |
| `channel`      | string     | `Todos`, `Tienda`, `En línea` o `Directo`.                                                                                                                                                |
| `search`       | string     | Búsqueda literal normalizada; escapar comodines y parametrizar SQL.                                                                                                                       |
| `page`         | entero     | Empieza en 1.                                                                                                                                                                             |
| `pageSize`     | entero     | Ventas UI: 10, clientes: 12. Aplicar límite de servidor ≤100.                                                                                                                             |
| `status`       | string     | `Todos`, `Pagado`, `Pendiente` o `Cancelado`.                                                                                                                                             |
| `sort`         | string     | Lista permitida: `date`, `amountCents`; nunca interpolar SQL arbitrario.                                                                                                                  |
| `direction`    | string     | `asc` o `desc`; desempate estable por ID.                                                                                                                                                 |

## Operaciones

### GET summary

Recibe filtros compartidos y devuelve `Summary`: `current`, `previous`, `series`, `channels`, `products`, `recent`, `totalOrders`.

Cada bloque de métricas tiene `revenueCents`, `paidCount`, `activeCustomers`, `ticketCents`, `pendingCents`, `pendingCount`. El período anterior tiene igual número de días y termina un día antes del actual. Máximo 15 puntos de serie, 5 productos y 5 ventas recientes.

```json
{
  "revenueCents": 3149,
  "paidCount": 2,
  "activeCustomers": 1,
  "ticketCents": 1575,
  "pendingCents": 9000,
  "pendingCount": 1
}
```

El fragmento anterior es un bloque de métricas válido de las pruebas; no es una respuesta completa de `summary`.

### GET orders

Recibe filtros, búsqueda, estado, página, tamaño y orden. Respuesta: `{ rows: Order[], total: number, page: number, pageSize: number }`. `total` cuenta todos los resultados filtrados; `rows` contiene solo la página. Ajustar páginas fuera de rango y devolver la página efectiva.

### GET customers

Recibe filtros, búsqueda, página y tamaño. Respuesta: `{ rows: Customer[], total: number }`. Cliente: `{ id, name, email, orders, revenueCents, lastOrder }`. El importe suma solo ventas pagadas; `orders` incluye todos los estados. El orden actual es ingreso descendente y desempate por ID.

### POST orders

Recibe un `NewOrder` y devuelve un `Order`. El cliente manda `Idempotency-Key`; el servidor debe guardar su resultado de forma atómica. Los reintentos automáticos de escritura están desactivados. Para reintentar manualmente una petición cuyo resultado se desconoce, implementar persistencia/reutilización de la misma clave en una capa de operación antes de habilitar producción.

```json
{
  "businessId": "comercio",
  "customerName": "Cliente de ejemplo",
  "customerEmail": "cliente@example.com",
  "product": "Lámpara de mesa",
  "quantity": 1,
  "amountCents": 89000,
  "date": "2026-09-30",
  "channel": "Tienda",
  "status": "Pendiente"
}
```

El servidor devuelve además `id` y `customerId`. El demo identifica clientes por correo dentro del negocio. Una aplicación real deberá resolver identidad, consentimiento, edición, impuestos y cálculos de precios según sus reglas. No confiar en el importe del navegador para cobrar.

### PATCH orders/:id

Cuerpo `{ businessId, status }`; devuelve `Order`. Autorizar la operación y su transición, registrar actor/fecha/antes/después y controlar conflictos mediante versión o ETag. La demo permite cambiar cualquiera de los tres estados; no procesa cobros ni devoluciones.

### GET orders/export

Mismos filtros y orden de ventas. Devuelve `Order[]`, máximo 10,000 filas. El servidor debe rechazar el exceso; no truncar silenciosamente. Para grandes exportaciones, diseñar trabajo asíncrono y descarga autorizada con expiración; esa extensión requerirá modificar el contrato.

## Errores y protección

- 400/422: entradas inválidas; validar longitud, rango, tipo, enumeraciones y fecha.
- 401/403: sesión o autorización. El frontend presenta un mensaje; implementar el flujo de login de cada proyecto.
- 404: recurso inexistente o no visible.
- 409: conflicto de versión o clave de idempotencia incompatible.
- 429: límite de solicitudes; no amplificarlo con reintentos agresivos.
- 5xx: fallo del servicio; observar y recuperar sin exponer SQL, secretos ni datos personales en mensajes.

Timeout del cliente: 15 segundos; cancelación mediante `AbortSignal`. Zod rechaza respuestas de forma incorrecta antes de mostrarlas. Usar consultas parametrizadas, límites, registros redactados y pruebas de acceso cruzado entre negocios. La API debe devolver importes compatibles con enteros seguros de JavaScript; para exceder ese rango, migrar el contrato a cadenas decimales.
