import {
  channels,
  type Customer,
  type Filters,
  type Order,
  type OrderQuery,
  type Summary,
} from './models'
import { dateLabel, daysBetween, normalize, shiftDate } from '../lib/format'

export function filterOrders(orders: Order[], filters: Filters) {
  return orders.filter(
    (o) =>
      o.businessId === filters.businessId &&
      o.date >= filters.start &&
      o.date <= filters.end &&
      (filters.channel === 'Todos' || o.channel === filters.channel)
  )
}
function metrics(orders: Order[]): Summary['current'] {
  const paid = orders.filter((o) => o.status === 'Pagado')
  const pending = orders.filter((o) => o.status === 'Pendiente')
  const revenueCents = paid.reduce((sum, o) => sum + o.amountCents, 0)
  return {
    revenueCents,
    paidCount: paid.length,
    activeCustomers: new Set(paid.map((o) => o.customerId)).size,
    ticketCents: paid.length ? Math.round(revenueCents / paid.length) : 0,
    pendingCents: pending.reduce((sum, o) => sum + o.amountCents, 0),
    pendingCount: pending.length,
  }
}
export function summarize(orders: Order[], filters: Filters): Summary {
  const current = filterOrders(orders, filters)
  const days = daysBetween(filters.start, filters.end)
  const previousStart = shiftDate(filters.start, -days)
  const previous = filterOrders(orders, {
    ...filters,
    start: previousStart,
    end: shiftDate(filters.start, -1),
  })
  const paid = current.filter((o) => o.status === 'Pagado')
  const previousPaid = previous.filter((o) => o.status === 'Pagado')
  // Aggregate once into day maps. Rendering does not repeatedly scan all orders.
  const dayMap = (rows: Order[]) => {
    const map = new Map<string, number>()
    for (const o of rows) map.set(o.date, (map.get(o.date) || 0) + o.amountCents)
    return map
  }
  const nowMap = dayMap(paid),
    prevMap = dayMap(previousPaid)
  const bucketSize = Math.max(1, Math.ceil(days / 15))
  const series: Summary['series'] = []
  for (let i = 0; i < days; i += bucketSize) {
    let revenueCents = 0,
      previousCents = 0
    for (let j = i; j < Math.min(i + bucketSize, days); j++) {
      revenueCents += nowMap.get(shiftDate(filters.start, j)) || 0
      previousCents += prevMap.get(shiftDate(previousStart, j)) || 0
    }
    series.push({ label: dateLabel(shiftDate(filters.start, i)), revenueCents, previousCents })
  }
  const productMap = new Map<string, Summary['products'][number]>()
  for (const o of paid) {
    const p = productMap.get(o.product) || { name: o.product, revenueCents: 0, quantity: 0 }
    p.revenueCents += o.amountCents
    p.quantity += o.quantity
    productMap.set(o.product, p)
  }
  return {
    current: metrics(current),
    previous: metrics(previous),
    series,
    channels: channels.map((name) => ({
      name,
      revenueCents: paid.filter((o) => o.channel === name).reduce((s, o) => s + o.amountCents, 0),
      count: paid.filter((o) => o.channel === name).length,
    })),
    products: [...productMap.values()].sort((a, b) => b.revenueCents - a.revenueCents).slice(0, 5),
    recent: [...current]
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      .slice(0, 5),
    totalOrders: current.length,
  }
}
export function queryOrders(orders: Order[], query: OrderQuery) {
  const term = normalize(query.search)
  const filtered = filterOrders(orders, query).filter(
    (o) =>
      (query.status === 'Todos' || o.status === query.status) &&
      (!term ||
        normalize(`${o.id} ${o.customerName} ${o.customerEmail} ${o.product}`).includes(term))
  )
  filtered.sort((a, b) => {
    const diff =
      query.sort === 'amountCents' ? a.amountCents - b.amountCents : a.date.localeCompare(b.date)
    return (diff || a.id.localeCompare(b.id)) * (query.direction === 'asc' ? 1 : -1)
  })
  const pageSize = Math.max(1, Math.min(100, query.pageSize))
  const page = Math.max(1, Math.min(query.page, Math.max(1, Math.ceil(filtered.length / pageSize))))
  return {
    rows: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    pageSize,
  }
}
export function customersFromOrders(orders: Order[], filters: Filters, search = ''): Customer[] {
  const map = new Map<string, Customer>()
  for (const o of filterOrders(orders, filters)) {
    const customer = map.get(o.customerId) || {
      id: o.customerId,
      name: o.customerName,
      email: o.customerEmail,
      orders: 0,
      revenueCents: 0,
      lastOrder: o.date,
    }
    customer.orders++
    customer.revenueCents += o.status === 'Pagado' ? o.amountCents : 0
    if (o.date > customer.lastOrder) customer.lastOrder = o.date
    map.set(o.customerId, customer)
  }
  const term = normalize(search)
  return [...map.values()]
    .filter((c) => normalize(`${c.name} ${c.email}`).includes(term))
    .sort((a, b) => b.revenueCents - a.revenueCents || a.id.localeCompare(b.id))
}
