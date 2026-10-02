-- PostgreSQL: diseño de referencia, NO ejecutado ni desplegado en este proyecto.
-- Aplicar mediante migraciones revisadas y pruebas de integración del backend.
-- La autorización de usuarios y el contexto del negocio se resuelven en el servidor.
BEGIN;

CREATE TABLE businesses (
  id text PRIMARY KEY,
  name text NOT NULL CHECK (length(name) BETWEEN 2 AND 100),
  currency char(3) NOT NULL DEFAULT 'MXN',
  timezone text NOT NULL DEFAULT 'America/Mazatlan',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
  business_id text NOT NULL REFERENCES businesses(id),
  user_subject text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'manager', 'analyst')),
  PRIMARY KEY (business_id, user_subject)
);

CREATE TABLE customers (
  business_id text NOT NULL REFERENCES businesses(id),
  id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, id)
);
CREATE UNIQUE INDEX customers_business_email ON customers (business_id, lower(email));

CREATE TABLE products (
  business_id text NOT NULL REFERENCES businesses(id),
  id uuid NOT NULL,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  price_cents bigint NOT NULL CHECK (price_cents >= 0),
  PRIMARY KEY (business_id, id)
);

CREATE TABLE orders (
  business_id text NOT NULL REFERENCES businesses(id),
  id uuid NOT NULL,
  customer_id uuid NOT NULL,
  business_date date NOT NULL,
  channel text NOT NULL CHECK (channel IN ('Tienda', 'En línea', 'Directo')),
  status text NOT NULL CHECK (status IN ('Pagado', 'Pendiente', 'Cancelado')),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  currency char(3) NOT NULL DEFAULT 'MXN',
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, id),
  FOREIGN KEY (business_id, customer_id) REFERENCES customers(business_id, id)
);

CREATE TABLE order_items (
  business_id text NOT NULL,
  order_id uuid NOT NULL,
  line_number integer NOT NULL CHECK (line_number > 0),
  product_id uuid NOT NULL,
  product_name_snapshot text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total_cents bigint NOT NULL CHECK (line_total_cents >= 0),
  PRIMARY KEY (business_id, order_id, line_number),
  FOREIGN KEY (business_id, order_id) REFERENCES orders(business_id, id),
  FOREIGN KEY (business_id, product_id) REFERENCES products(business_id, id)
);

CREATE TABLE order_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id text NOT NULL,
  order_id uuid NOT NULL,
  actor_subject text NOT NULL,
  previous_status text NOT NULL,
  next_status text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (business_id, order_id) REFERENCES orders(business_id, id)
);

CREATE TABLE idempotency_keys (
  business_id text NOT NULL REFERENCES businesses(id),
  operation_key text NOT NULL,
  request_hash text NOT NULL,
  response_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, operation_key)
);

-- Filtros por negocio/período y paginación estable.
CREATE INDEX orders_business_date_id ON orders (business_id, business_date DESC, id DESC);
-- Historial de un cliente.
CREATE INDEX orders_business_customer_date ON orders (business_id, customer_id, business_date DESC);
-- Bandeja de pendientes sin indexar todos los estados.
CREATE INDEX orders_pending_by_business ON orders (business_id, business_date DESC) WHERE status = 'Pendiente';
CREATE INDEX audit_order_history ON order_audit (business_id, order_id, occurred_at DESC);

COMMIT;

-- Ejemplos parametrizados. $1 es el negocio autorizado en el servidor.
-- 1. KPI del período. Usar período anterior de igual longitud por separado.
-- SELECT COALESCE(sum(amount_cents) FILTER (WHERE status = 'Pagado'), 0) AS revenue_cents,
--        count(*) FILTER (WHERE status = 'Pagado') AS paid_count,
--        count(DISTINCT customer_id) FILTER (WHERE status = 'Pagado') AS active_customers
-- FROM orders WHERE business_id = $1 AND business_date BETWEEN $2 AND $3;

-- 2. Página por cursor; $4 y $5 proceden del último registro de la página previa.
-- SELECT * FROM orders
-- WHERE business_id = $1 AND business_date BETWEEN $2 AND $3
--   AND (business_date, id) < ($4::date, $5::uuid)
-- ORDER BY business_date DESC, id DESC LIMIT 50;

-- 3. Tendencia diaria para la gráfica.
-- SELECT business_date, sum(amount_cents) AS revenue_cents
-- FROM orders WHERE business_id = $1 AND business_date BETWEEN $2 AND $3 AND status = 'Pagado'
-- GROUP BY business_date ORDER BY business_date;

-- El frontend actual espera páginas numeradas: adaptar el contrato antes de usar cursor.
-- En una transacción, validar sum(order_items.line_total_cents) = orders.amount_cents.
-- Cambiar estado, incrementar version e insertar order_audit atómicamente.
-- Este esquema NO habilita RLS: implementar autorización y aislamiento probados antes de operar.
-- Si se añade RLS, el rol de aplicación no debe ser dueño ni tener BYPASSRLS.
-- Planificar rollback por migración: no borrar estas tablas con datos productivos.
