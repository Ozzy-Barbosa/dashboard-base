import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useSearchParams } from 'react-router-dom'
import {
  ArrowDownUp,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useApp, useDebounced } from '../../app/context'
import { getProvider } from '../../data/provider'
import { statuses, type Order, type OrderQuery, type OrderStatus } from '../../domain/models'
import { dateLabel, exactMoney, initials, number } from '../../lib/format'
import { downloadCsv, ordersCsv } from '../../lib/csv'
import { EmptyState, ErrorState, Loading, StatusBadge } from '../../components/ui'
import { OrderDetail } from './OrderDialogs'

export default function Orders() {
  const { filters, notify } = useApp(),
    [params, setParams] = useSearchParams(),
    location = useLocation()
  const [search, setSearch] = useState(params.get('q') || '')
  const debounced = useDebounced(search)
  const status = statuses.find((s) => s === params.get('status')) || 'Todos'
  const page = Math.max(1, Math.floor(Number(params.get('page')) || 1))
  const [sort, setSort] = useState<OrderQuery['sort']>('date'),
    [direction, setDirection] = useState<'asc' | 'desc'>('desc')
  const [detail, setDetail] = useState<Order | null>(null),
    [exporting, setExporting] = useState(false)
  const options: OrderQuery = {
    ...filters,
    search: debounced,
    status,
    page,
    pageSize: 10,
    sort,
    direction,
  }
  const query = useQuery({
    queryKey: ['orders', options],
    queryFn: async ({ signal }) => (await getProvider()).orders(options, signal),
  })
  function update(values: Record<string, string>) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(values).forEach(([k, v]) => next.set(k, v))
        return next
      },
      { replace: true, state: location.state }
    )
  }
  function orderBy(column: OrderQuery['sort']) {
    setSort(column)
    setDirection(sort === column && direction === 'desc' ? 'asc' : 'desc')
    update({ page: '1' })
  }
  async function exportRows() {
    setExporting(true)
    try {
      const rows = await (await getProvider()).exportOrders(options)
      downloadCsv(
        ordersCsv(rows),
        `pulso-ventas-${filters.businessId}-${filters.start}-${filters.end}.csv`
      )
      notify(`${rows.length} ventas exportadas con los filtros actuales.`)
    } catch (e) {
      notify(e instanceof Error ? e.message : 'No se pudo exportar.', 'error')
    } finally {
      setExporting(false)
    }
  }
  const total = query.data?.total || 0
  return (
    <div className="page-content">
      <section className="card sales-card">
        <div className="card-heading">
          <div>
            <h2>
              Todas las ventas <span className="count-pill">{number(total)}</span>
            </h2>
            <p>Consulta, organiza y da seguimiento a cada operación.</p>
          </div>
          <button
            className="button"
            onClick={() => void exportRows()}
            disabled={exporting || query.isPending || !total}
          >
            <Download size={16} />
            {exporting ? 'Exportando…' : 'Exportar CSV'}
          </button>
        </div>
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              aria-label="Buscar ventas"
              placeholder="Buscar cliente, concepto o folio…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                update({ q: e.target.value, page: '1' })
              }}
            />
            {search && (
              <button
                className="icon-button"
                aria-label="Limpiar búsqueda"
                onClick={() => {
                  setSearch('')
                  update({ q: '', page: '1' })
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>
          <label className="status-filter">
            <SlidersHorizontal size={15} />
            <span className="sr-only">Estado de venta</span>
            <select
              value={status}
              onChange={(e) => update({ status: e.target.value as OrderStatus, page: '1' })}
            >
              <option value="Todos">Todos los estados</option>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        {query.isPending ? (
          <Loading />
        ) : query.error ? (
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        ) : !total ? (
          <EmptyState
            title="No encontramos ventas"
            description="Cambia la búsqueda, el estado o los filtros de arriba."
            action={
              <button
                className="button"
                onClick={() => {
                  setSearch('')
                  update({ q: '', status: 'Todos', page: '1' })
                }}
              >
                Limpiar búsqueda y estado
              </button>
            }
          />
        ) : (
          <>
            <div className="table-scroll">
              <table className="sales-table">
                <caption className="sr-only">Ventas filtradas; diez registros por página</caption>
                <thead>
                  <tr>
                    <th>Venta / cliente</th>
                    <th>Concepto</th>
                    <th
                      aria-sort={
                        sort === 'date'
                          ? direction === 'desc'
                            ? 'descending'
                            : 'ascending'
                          : 'none'
                      }
                    >
                      <button onClick={() => orderBy('date')}>
                        Fecha <ArrowDownUp size={13} />
                      </button>
                    </th>
                    <th>Canal</th>
                    <th
                      aria-sort={
                        sort === 'amountCents'
                          ? direction === 'desc'
                            ? 'descending'
                            : 'ascending'
                          : 'none'
                      }
                    >
                      <button onClick={() => orderBy('amountCents')}>
                        Importe <ArrowDownUp size={13} />
                      </button>
                    </th>
                    <th>Estado</th>
                    <th>
                      <span className="sr-only">Detalle</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.rows.map((order) => (
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
                      <td>
                        <span>{order.product}</span>
                        <small className="cell-sub">
                          {order.quantity} {order.quantity === 1 ? 'unidad' : 'unidades'}
                        </small>
                      </td>
                      <td className="nowrap">{dateLabel(order.date)}</td>
                      <td>{order.channel}</td>
                      <td className="amount">{exactMoney(order.amountCents)}</td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`Ver venta ${order.id}`}
                          onClick={() => setDetail(order)}
                        >
                          <ArrowUpRight size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>
                Mostrando {(query.data.page - 1) * 10 + 1}–{Math.min(query.data.page * 10, total)}{' '}
                de {number(total)} ventas
              </span>
              <div>
                <button
                  className="icon-button"
                  aria-label="Página anterior"
                  disabled={query.data.page <= 1}
                  onClick={() => update({ page: String(query.data.page - 1) })}
                >
                  <ChevronLeft size={18} />
                </button>
                <span>
                  Página {query.data.page} de {Math.ceil(total / 10)}
                </span>
                <button
                  className="icon-button"
                  aria-label="Página siguiente"
                  disabled={query.data.page * 10 >= total}
                  onClick={() => update({ page: String(query.data.page + 1) })}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      <p className="method-note">
        La exportación incluye todos los resultados filtrados, hasta 10,000 registros. Los importes
        están expresados en MXN.
      </p>
      {detail && <OrderDetail key={detail.id} order={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}
