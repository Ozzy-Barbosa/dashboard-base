import type {
  BusinessId,
  CustomerPage,
  Filters,
  NewOrder,
  Order,
  OrderPage,
  OrderQuery,
  OrderStatus,
  Summary,
} from '../domain/models'

export interface DataProvider {
  summary(filters: Filters, signal?: AbortSignal): Promise<Summary>
  orders(query: OrderQuery, signal?: AbortSignal): Promise<OrderPage>
  customers(
    filters: Filters,
    search: string,
    page: number,
    signal?: AbortSignal
  ): Promise<CustomerPage>
  createOrder(input: NewOrder): Promise<Order>
  updateStatus(businessId: BusinessId, id: string, status: OrderStatus): Promise<Order>
  exportOrders(query: OrderQuery, signal?: AbortSignal): Promise<Order[]>
}
export const isDemo = import.meta.env.VITE_DATA_MODE !== 'api'
// Only the chosen adapter (and its demo dataset) enters the active module graph.
const providerPromise = isDemo
  ? import('./demo').then((m) => m.demoProvider)
  : import('./http').then((m) => m.httpProvider)
export const getProvider = () => providerPromise
