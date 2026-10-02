import { describe, expect, it } from 'vitest'
import { customersFromOrders, filterOrders, queryOrders, summarize } from './analytics'
import { dateSchema, newOrderSchema, type Filters, type Order, type OrderQuery } from './models'
import { daysBetween, delta, shiftDate } from '../lib/format'
import { csvCell, ordersCsv } from '../lib/csv'
import { seedOrders } from '../data/seed'

const base: Order = {
  id: 'A',
  businessId: 'comercio',
  customerId: 'C1',
  customerName: 'María Luna',
  customerEmail: 'maria@example.com',
  product: 'Lámpara',
  quantity: 1,
  amountCents: 1050,
  date: '2026-09-01',
  channel: 'Tienda',
  status: 'Pagado',
}
const filters: Filters = {
  businessId: 'comercio',
  start: '2026-09-01',
  end: '2026-09-30',
  channel: 'Todos',
}
const query: OrderQuery = {
  ...filters,
  search: '',
  status: 'Todos',
  page: 1,
  pageSize: 10,
  sort: 'date',
  direction: 'desc',
}
const orders: Order[] = [
  base,
  { ...base, id: 'B', amountCents: 2099, date: '2026-09-30' },
  { ...base, id: 'C', status: 'Pendiente', amountCents: 9000 },
  { ...base, id: 'D', status: 'Cancelado', amountCents: 4000 },
  { ...base, id: 'E', date: '2026-08-02', amountCents: 2000 },
  { ...base, id: 'F', date: '2026-08-01', amountCents: 5000 },
  { ...base, id: 'G', businessId: 'servicios', amountCents: 999000 },
]

describe('Reglas de negocio', () => {
  it('cuenta solo ventas pagadas y opera con centavos enteros', () => {
    const s = summarize(orders, filters)
    expect(s.current).toEqual({
      revenueCents: 3149,
      paidCount: 2,
      activeCustomers: 1,
      ticketCents: 1575,
      pendingCents: 9000,
      pendingCount: 1,
    })
    expect(s.totalOrders).toBe(4)
  })
  it('compara exactamente 30 días anteriores, del 2 al 31 agosto', () => {
    expect(summarize(orders, filters).previous.revenueCents).toBe(2000)
  })
  it('incluye ambos límites y aísla negocio y canal', () => {
    expect(filterOrders(orders, filters).length).toBe(4)
    expect(filterOrders(orders, { ...filters, channel: 'Directo' })).toEqual([])
  })
  it('conciliación de gráfico, canales y productos con KPI', () => {
    const s = summarize(seedOrders('comercio'), filters)
    expect(s.series.reduce((sum, p) => sum + p.revenueCents, 0)).toBe(s.current.revenueCents)
    expect(s.series.reduce((sum, p) => sum + p.previousCents, 0)).toBe(s.previous.revenueCents)
    expect(s.channels.reduce((sum, p) => sum + p.revenueCents, 0)).toBe(s.current.revenueCents)
    expect(s.products.length).toBe(5)
  })
  it('el período vacío no produce NaN, Infinity ni división entre cero', () => {
    const s = summarize([], filters)
    expect(s.current.ticketCents).toBe(0)
    expect(s.current.revenueCents).toBe(0)
    expect(delta(100, 0)).toBeNull()
    expect(delta(0, 0)).toBeNull()
  })
  it('busca sin acentos y combina estado con filtros', () => {
    expect(
      queryOrders(orders, { ...query, search: 'maria', status: 'Pendiente' }).rows.map((o) => o.id)
    ).toEqual(['C'])
    expect(queryOrders(orders, { ...query, search: 'sin resultados' }).total).toBe(0)
  })
  it('ordena y pagina de forma estable sin duplicar resultados', () => {
    const first = queryOrders(orders, {
      ...query,
      pageSize: 2,
      sort: 'amountCents',
      direction: 'asc',
    })
    const second = queryOrders(orders, {
      ...query,
      pageSize: 2,
      page: 2,
      sort: 'amountCents',
      direction: 'asc',
    })
    expect(first.rows.map((o) => o.id)).toEqual(['A', 'B'])
    expect(second.rows.map((o) => o.id)).toEqual(['D', 'C'])
    expect(queryOrders(orders, { ...query, page: 999, pageSize: 2 }).page).toBe(2)
  })
  it('agrupa clientes y no suma pendientes o cancelados a sus ingresos', () => {
    expect(customersFromOrders(orders, filters)).toEqual([
      {
        id: 'C1',
        name: 'María Luna',
        email: 'maria@example.com',
        orders: 4,
        revenueCents: 3149,
        lastOrder: '2026-09-30',
      },
    ])
  })
  it('es determinista y todos los ejemplos cumplen el contrato', () => {
    const seed = seedOrders('servicios')
    expect(seedOrders('servicios')).toBe(seed)
    expect(seed.every((o) => newOrderSchema.safeParse(o).success)).toBe(true)
    expect(seed.length).toBeGreaterThan(2000)
  })
})
describe('Fechas, entradas y exportaciones', () => {
  it('mantiene los días civiles en límites de mes y año', () => {
    expect(shiftDate('2026-01-01', -1)).toBe('2025-12-31')
    expect(daysBetween('2026-09-01', '2026-09-30')).toBe(30)
    expect(dateSchema.safeParse('2026-02-30').success).toBe(false)
  })
  it('rechaza cantidades y dinero inválidos', () => {
    expect(newOrderSchema.safeParse({ ...base, amountCents: 1.5 }).success).toBe(false)
    expect(newOrderSchema.safeParse({ ...base, quantity: 0 }).success).toBe(false)
    expect(newOrderSchema.safeParse({ ...base, customerEmail: 'invalid' }).success).toBe(false)
  })
  it('escapa comillas, nuevas líneas y fórmulas del CSV', () => {
    expect(csvCell('=1+1')).toBe('"\'=1+1"')
    expect(csvCell('  @SUM(A1)')).toBe('"\'  @SUM(A1)"')
    expect(csvCell('a"b,c\nd')).toBe('"a""b,c\nd"')
    const csv = ordersCsv([base])
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv).toContain('"10.50"')
  })
})
