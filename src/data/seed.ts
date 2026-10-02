import { businesses, DEMO_TODAY } from '../config/businesses'
import { channels, type BusinessId, type Order } from '../domain/models'
import { shiftDate } from '../lib/format'

const firstNames = [
  'Andrea',
  'Diego',
  'Valeria',
  'Mateo',
  'Camila',
  'Santiago',
  'Regina',
  'Daniel',
  'Mariana',
  'Emiliano',
  'Sofía',
  'Gabriel',
]
const lastNames = ['Moreno', 'Rivera', 'Castro', 'Luna', 'Vega', 'Santos', 'Navarro', 'Cruz']
const cache = new Map<BusinessId, Order[]>()
export function seedOrders(businessId: BusinessId): Order[] {
  const cached = cache.get(businessId)
  if (cached) return cached
  let state = businessId === 'comercio' ? 42 : businessId === 'servicios' ? 107 : 237
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
  const orders: Order[] = [],
    business = businesses[businessId]
  for (let day = 179; day >= 0; day--) {
    const count = Math.floor(7 + random() * 11 + (179 - day) / 35)
    for (let i = 0; i < count; i++) {
      const ci = Math.floor(random() * 96)
      const product = business.products[Math.floor(random() * business.products.length)]
      const quantity = random() > 0.75 ? 2 : 1
      const r = random()
      orders.push({
        id: `VN-${businessId.slice(0, 2).toUpperCase()}-${String(1000 + orders.length)}`,
        businessId,
        customerId: `${businessId}-C${ci}`,
        customerName: `${firstNames[ci % 12]} ${lastNames[Math.floor(ci / 12)]}`,
        customerEmail: `cliente${ci + 1}@${businessId}.example`,
        product: product.name,
        quantity,
        amountCents: product.priceCents * quantity,
        channel: channels[random() < 0.48 ? 0 : random() < 0.65 ? 1 : 2],
        status: r < 0.86 ? 'Pagado' : r < 0.97 ? 'Pendiente' : 'Cancelado',
        date: shiftDate(DEMO_TODAY, -day),
      })
    }
  }
  cache.set(businessId, orders)
  return orders
}
