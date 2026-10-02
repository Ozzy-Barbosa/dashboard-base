import { expect, it } from 'vitest'
import { queryOrders, summarize } from './analytics'
import { seedOrders } from '../data/seed'
import type { Filters } from './models'

it('procesa 100,000 operaciones manteniendo totales y páginas acotadas', () => {
  const seed = seedOrders('comercio')
  const rows = Array.from({ length: 100000 }, (_, i) => ({
    ...seed[i % seed.length],
    id: `S-${i}`,
  }))
  const filters: Filters = {
    businessId: 'comercio',
    start: '2026-09-01',
    end: '2026-09-30',
    channel: 'Todos',
  }
  const start = performance.now()
  const summary = summarize(rows, filters)
  const page = queryOrders(rows, {
    ...filters,
    search: '',
    status: 'Todos',
    page: 1,
    pageSize: 10,
    sort: 'date',
    direction: 'desc',
  })
  const elapsed = performance.now() - start
  const expected = rows
    .filter((o) => o.date >= filters.start && o.date <= filters.end && o.status === 'Pagado')
    .reduce((sum, o) => sum + o.amountCents, 0)
  expect(summary.current.revenueCents).toBe(expected)
  expect(page.rows).toHaveLength(10)
  expect(new Set(page.rows.map((o) => o.id)).size).toBe(10)
  console.info(
    `Ensayo local: ${rows.length} registros; resumen + primera página ${elapsed.toFixed(1)} ms. No es una prueba de concurrencia ni un SLA.`
  )
})
