import { z } from 'zod'

export const businessIds = ['comercio', 'servicios', 'cafeteria'] as const
export const channels = ['Tienda', 'En línea', 'Directo'] as const
export const statuses = ['Pagado', 'Pendiente', 'Cancelado'] as const
export const businessIdSchema = z.enum(businessIds)
export const channelSchema = z.enum(channels)
export const statusSchema = z.enum(statuses)
export type BusinessId = z.infer<typeof businessIdSchema>
export type Channel = z.infer<typeof channelSchema>
export type OrderStatus = z.infer<typeof statusSchema>
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T12:00:00Z`)
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  }, 'Fecha inválida')

export const orderSchema = z.object({
  id: z.string().min(1),
  businessId: businessIdSchema,
  customerId: z.string().min(1),
  customerName: z.string().min(2).max(80),
  customerEmail: z.email(),
  product: z.string().min(2).max(100),
  quantity: z.number().int().min(1).max(10000),
  amountCents: z.number().int().min(1).max(1_000_000_000),
  date: dateSchema,
  channel: channelSchema,
  status: statusSchema,
})
export type Order = z.infer<typeof orderSchema>
export const newOrderSchema = orderSchema.omit({ id: true, customerId: true })
export type NewOrder = z.infer<typeof newOrderSchema>
export const filterSchema = z
  .object({
    businessId: businessIdSchema,
    start: dateSchema,
    end: dateSchema,
    channel: z.union([channelSchema, z.literal('Todos')]),
  })
  .refine((f) => f.start <= f.end, 'El inicio debe ser anterior al fin')
export type Filters = z.infer<typeof filterSchema>
export type OrderQuery = Filters & {
  search: string
  status: OrderStatus | 'Todos'
  page: number
  pageSize: number
  sort: 'date' | 'amountCents'
  direction: 'asc' | 'desc'
}
export const pageSchema = z.object({
  rows: z.array(orderSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
})
export type OrderPage = z.infer<typeof pageSchema>
const metricSchema = z.object({
  revenueCents: z.number(),
  paidCount: z.number(),
  activeCustomers: z.number(),
  ticketCents: z.number(),
  pendingCents: z.number(),
  pendingCount: z.number(),
})
export const summarySchema = z.object({
  current: metricSchema,
  previous: metricSchema,
  series: z.array(
    z.object({ label: z.string(), revenueCents: z.number(), previousCents: z.number() })
  ),
  channels: z.array(z.object({ name: channelSchema, revenueCents: z.number(), count: z.number() })),
  products: z.array(z.object({ name: z.string(), revenueCents: z.number(), quantity: z.number() })),
  recent: z.array(orderSchema),
  totalOrders: z.number(),
})
export type Summary = z.infer<typeof summarySchema>
export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  orders: z.number(),
  revenueCents: z.number(),
  lastOrder: dateSchema,
})
export type Customer = z.infer<typeof customerSchema>
export const customerPageSchema = z.object({ rows: z.array(customerSchema), total: z.number() })
export type CustomerPage = z.infer<typeof customerPageSchema>
