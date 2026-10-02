import { beforeEach, describe, expect, it, vi } from 'vitest'
import { demoProvider } from './demo'
import type { Filters, NewOrder } from '../domain/models'

const memory = new Map<string, string>()
beforeEach(() => {
  memory.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value)
    },
    removeItem: (key: string) => {
      memory.delete(key)
    },
  })
})
const filters: Filters = {
  businessId: 'comercio',
  start: '2026-09-01',
  end: '2026-09-30',
  channel: 'Todos',
}
const input: NewOrder = {
  businessId: 'comercio',
  customerName: 'Cliente de prueba',
  customerEmail: 'qa@example.com',
  product: 'Set de cerámica',
  quantity: 1,
  amountCents: 12345,
  date: '2026-09-30',
  channel: 'Tienda',
  status: 'Pendiente',
}
describe('Proveedor demo', () => {
  it('crea, persiste y actualiza conciliando el total y aislando negocios', async () => {
    const before = await demoProvider.summary(filters)
    const other = await demoProvider.summary({ ...filters, businessId: 'servicios' })
    const row = await demoProvider.createOrder(input)
    expect((await demoProvider.summary(filters)).current.revenueCents).toBe(
      before.current.revenueCents
    )
    await demoProvider.updateStatus('comercio', row.id, 'Pagado')
    expect((await demoProvider.summary(filters)).current.revenueCents).toBe(
      before.current.revenueCents + 12345
    )
    expect(
      (await demoProvider.summary({ ...filters, businessId: 'servicios' })).current.revenueCents
    ).toBe(other.current.revenueCents)
    await expect(demoProvider.updateStatus('servicios', row.id, 'Pagado')).rejects.toThrow(
      'No se encontró'
    )
  })
  it('identifica al mismo cliente por correo normalizado', async () => {
    const a = await demoProvider.createOrder(input),
      b = await demoProvider.createOrder({ ...input, customerEmail: 'QA@example.com' })
    expect(a.customerId).toBe(b.customerId)
  })
  it('recupera almacenamiento corrupto sin pantalla en blanco', async () => {
    memory.set('pulso.demo.orders.v1', 'invalid JSON')
    expect((await demoProvider.summary(filters)).current.paidCount).toBeGreaterThan(0)
  })
  it('informa fallas de persistencia sin confirmar guardado', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceeded')
      },
    })
    await expect(demoProvider.createOrder(input)).rejects.toThrow('No se pudo guardar')
  })
  it('cancela consultas abortadas', async () => {
    const abort = new AbortController()
    abort.abort()
    await expect(demoProvider.summary(filters, abort.signal)).rejects.toThrow()
  })
})
