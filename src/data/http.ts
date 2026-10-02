import { z } from 'zod'
import {
  customerPageSchema,
  newOrderSchema,
  orderSchema,
  pageSchema,
  summarySchema,
} from '../domain/models'
import type { DataProvider } from './provider'

// A contract-ready client; it is NOT a backend or an authentication system.
async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestInit = {}
): Promise<T> {
  const configured = import.meta.env.VITE_API_URL
  if (!configured) throw new Error('Falta configurar la dirección de la API.')
  const base = new URL(configured)
  if (base.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(base.hostname))
    throw new Error('La API debe usar HTTPS.')
  const timeout = AbortSignal.timeout(15000)
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout
  const response = await fetch(new URL(path, base.href.endsWith('/') ? base : `${base.href}/`), {
    ...options,
    signal,
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...options.headers },
  })
  if (!response.ok) {
    if (response.status === 401)
      throw new Error('Tu sesión terminó. Vuelve a iniciar sesión en el sistema de tu negocio.')
    if (response.status === 403) throw new Error('No tienes permiso para realizar esta acción.')
    if (response.status === 429)
      throw new Error('Demasiadas solicitudes. Espera un momento y vuelve a intentar.')
    throw new Error(`No se pudo completar la solicitud (${response.status}).`)
  }
  const result = schema.safeParse(await response.json())
  if (!result.success) throw new Error('La API devolvió datos con un formato inesperado.')
  return result.data
}
function qs(value: object) {
  return new URLSearchParams(
    Object.entries(value).map(([key, val]) => [key, String(val)])
  ).toString()
}
export const httpProvider: DataProvider = {
  summary: (filters, signal) => request(`summary?${qs(filters)}`, summarySchema, { signal }),
  orders: (query, signal) => request(`orders?${qs(query)}`, pageSchema, { signal }),
  customers: (filters, search, page, signal) =>
    request(`customers?${qs({ ...filters, search, page, pageSize: 12 })}`, customerPageSchema, {
      signal,
    }),
  createOrder: (input) =>
    request('orders', orderSchema, {
      method: 'POST',
      body: JSON.stringify(newOrderSchema.parse(input)),
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }),
  updateStatus: (businessId, id, status) =>
    request(`orders/${encodeURIComponent(id)}`, orderSchema, {
      method: 'PATCH',
      body: JSON.stringify({ businessId, status }),
    }),
  exportOrders: (query, signal) =>
    request(`orders/export?${qs(query)}`, z.array(orderSchema).max(10000), { signal }),
}
