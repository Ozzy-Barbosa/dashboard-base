import { useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  ShoppingBag,
  Target,
  UsersRound,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useApp, useSummary } from '../../app/context'
import { RevenueChart, ChannelChart } from '../../components/Charts'
import { Change, EmptyState, ErrorState, Loading, StatusBadge } from '../../components/ui'
import { dateLabel, initials, money, number } from '../../lib/format'
import type { Order } from '../../domain/models'
import { OrderDetail } from '../orders/OrderDialogs'

export default function Overview() {
  const query = useSummary(),
    { business, days } = useApp(),
    { search } = useLocation()
  const [detail, setDetail] = useState<Order | null>(null)
  if (query.isPending) return <Loading />
  if (query.error) return <ErrorState error={query.error} retry={() => void query.refetch()} />
  const data = query.data,
    { current, previous } = data
  const goal = Math.round((business.goalCents * days) / 30),
    progress = goal ? (current.revenueCents / goal) * 100 : 0
  const metrics = [
    {
      label: 'Ingresos cobrados',
      value: money(current.revenueCents),
      icon: Banknote,
      current: current.revenueCents,
      previous: previous.revenueCents,
      caption: 'MXN · ventas pagadas',
      featured: true,
    },
    {
      label: 'Ventas completadas',
      value: number(current.paidCount),
      icon: ShoppingBag,
      current: current.paidCount,
      previous: previous.paidCount,
      caption: 'operaciones pagadas',
    },
    {
      label: 'Clientes activos',
      value: number(current.activeCustomers),
      icon: UsersRound,
      current: current.activeCustomers,
      previous: previous.activeCustomers,
      caption: 'con al menos una compra pagada',
    },
    {
      label: 'Ticket promedio',
      value: money(current.ticketCents),
      icon: CircleDollarSign,
      current: current.ticketCents,
      previous: previous.ticketCents,
      caption: 'MXN · por venta pagada',
    },
  ]
  return (
    <div className="page-content">
      <section className="metrics-grid" aria-label="Indicadores del período">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className={`metric-card ${metric.featured ? 'featured' : ''}`}
          >
            <div className="metric-top">
              <span>{metric.label}</span>
              <metric.icon size={19} />
            </div>
            <strong className="metric-value">{metric.value}</strong>
            <div className="metric-bottom">
              <Change current={metric.current} previous={metric.previous} />
              <span>vs. período anterior</span>
            </div>
            <span className="sr-only">{metric.caption}</span>
          </article>
        ))}
      </section>
      {!data.totalOrders ? (
        <EmptyState
          title="Tu siguiente historia empieza con una venta"
          description="No hay operaciones en este período y canal. Cambia los filtros o registra una nueva venta."
        />
      ) : (
        <>
          <div className="charts-grid">
            <RevenueChart summary={data} />
            <ChannelChart summary={data} />
          </div>
          <div className="insight-strip">
            <div className="insight-symbol">
              <Target size={20} />
            </div>
            <div>
              <strong>Un paso más cerca de tu meta</strong>
              <p>
                Llevas el <b>{progress.toFixed(1)}%</b> de {money(goal)} para estos {days} días.
              </p>
            </div>
            <div className="goal-track">
              <div style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
            <Link to={{ pathname: '/configuracion', search }}>
              Ajustar meta <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="bottom-grid">
            <section className="card recent-card">
              <div className="card-heading">
                <div>
                  <h2>Últimas ventas</h2>
                  <p>El movimiento más reciente de tu negocio.</p>
                </div>
                <Link className="text-link" to={{ pathname: '/ventas', search }}>
                  Ver todas <ArrowRight size={15} />
                </Link>
              </div>
              <div className="table-scroll">
                <table>
                  <caption className="sr-only">Últimas cinco ventas</caption>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Fecha</th>
                      <th>Importe</th>
                      <th>Estado</th>
                      <th>
                        <span className="sr-only">Detalle</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <div className="customer-cell">
                            <span className="avatar mini">{initials(order.customerName)}</span>
                            <div>
                              <strong>{order.customerName}</strong>
                              <small>{order.id}</small>
                            </div>
                          </div>
                        </td>
                        <td className="nowrap">{dateLabel(order.date)}</td>
                        <td className="amount">{money(order.amountCents)}</td>
                        <td>
                          <StatusBadge status={order.status} />
                        </td>
                        <td>
                          <button
                            className="icon-button"
                            aria-label={`Ver venta ${order.id}`}
                            onClick={() => setDetail(order)}
                          >
                            <ArrowUpRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="card products-card">
              <div className="card-heading">
                <div>
                  <h2>Lo más vendido</h2>
                  <p>Por ingresos cobrados.</p>
                </div>
                <span className="small-tag">TOP 5</span>
              </div>
              <ol className="product-list">
                {data.products.map((product, index) => (
                  <li key={product.name}>
                    <span className="product-rank">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <div className="product-label">
                        <strong>{product.name}</strong>
                        <span>{money(product.revenueCents)}</span>
                      </div>
                      <div className="product-bar">
                        <i
                          style={{
                            width: `${(product.revenueCents / Math.max(1, data.products[0].revenueCents)) * 100}%`,
                          }}
                        />
                      </div>
                      <small>{product.quantity} unidades</small>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </>
      )}
      <p className="method-note">
        Los ingresos consideran ventas pagadas, sin descontar costos ni impuestos. La comparación
        usa los {days} días anteriores.
      </p>
      {detail && <OrderDetail key={detail.id} order={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}
