import { z } from 'zod'
import { filterOrders, queryOrders, summarize, customersFromOrders } from '../domain/analytics'
import { newOrderSchema, orderSchema, type BusinessId, type Order } from '../domain/models'
import type { DataProvider } from './provider'
import { seedOrders } from './seed'
import { normalize } from '../lib/format'

const STORAGE_KEY = 'pulso.demo.orders.v1'
const MAX_CHANGES = 500
function changes(): Order[] {
  try {
    return z
      .array(orderSchema)
      .max(MAX_CHANGES)
      .parse(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
  } catch {
    return []
  }
}
function allOrders(id: BusinessId) {
  const updates = new Map(
    changes()
      .filter((o) => o.businessId === id)
      .map((o) => [o.id, o])
  )
  const result = seedOrders(id).map((o) => {
    const updated = updates.get(o.id)
    updates.delete(o.id)
    return updated || o
  })
  return [...result, ...updates.values()]
}
function persist(order: Order) {
  const rows = changes().filter((o) => o.id !== order.id)
  if (rows.length >= MAX_CHANGES)
    throw new Error(
      'El demo admite hasta 500 cambios. Usa otro navegador o elimina los datos del demo desde Configuración.'
    )
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...rows, order]))
  } catch {
    throw new Error(
      'No se pudo guardar. Revisa el espacio o los permisos de almacenamiento del navegador.'
    )
  }
  return order
}
async function latency(signal?: AbortSignal) {
  signal?.throwIfAborted()
  await new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('Cancelado', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, 180)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
  signal?.throwIfAborted()
}
export const demoProvider: DataProvider = {
  async summary(filters, signal) {
    await latency(signal)
    return summarize(allOrders(filters.businessId), filters)
  },
  async orders(query, signal) {
    await latency(signal)
    return queryOrders(allOrders(query.businessId), query)
  },
  async customers(filters, search, page, signal) {
    await latency(signal)
    const rows = customersFromOrders(allOrders(filters.businessId), filters, search)
    return { rows: rows.slice((page - 1) * 12, page * 12), total: rows.length }
  },
  async createOrder(input) {
    const data = newOrderSchema.parse(input)
    await latency()
    const existing = allOrders(data.businessId).find(
      (o) => normalize(o.customerEmail) === normalize(data.customerEmail)
    )
    return persist({
      ...data,
      customerName: existing?.customerName || data.customerName,
      customerEmail: data.customerEmail.trim().toLowerCase(),
      id: `VN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      customerId: existing?.customerId || `C-${crypto.randomUUID()}`,
    })
  },
  async updateStatus(businessId, id, status) {
    await latency()
    const order = allOrders(businessId).find((o) => o.id === id)
    if (!order) throw new Error('No se encontró la venta. Actualiza e intenta nuevamente.')
    return persist(orderSchema.parse({ ...order, status }))
  },
  async exportOrders(query, signal) {
    await latency(signal)
    const term = normalize(query.search)
    const rows = filterOrders(allOrders(query.businessId), query).filter(
      (o) =>
        (query.status === 'Todos' || o.status === query.status) &&
        (!term ||
          normalize(`${o.id} ${o.customerName} ${o.customerEmail} ${o.product}`).includes(term))
    )
    rows.sort(
      (a, b) =>
        ((query.sort === 'amountCents'
          ? a.amountCents - b.amountCents
          : a.date.localeCompare(b.date)) || a.id.localeCompare(b.id)) *
        (query.direction === 'asc' ? 1 : -1)
    )
    if (rows.length > 10000)
      throw new Error('Reduce el período para exportar hasta 10,000 registros.')
    return rows
  },
}
export function resetDemo() {
  localStorage.removeItem(STORAGE_KEY)
}
