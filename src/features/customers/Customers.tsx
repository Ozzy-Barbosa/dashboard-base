import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, ChevronLeft, ChevronRight, Search, UsersRound } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp, useDebounced } from '../../app/context'
import { getProvider } from '../../data/provider'
import { dateLabel, initials, money, number } from '../../lib/format'
import { EmptyState, ErrorState, Loading } from '../../components/ui'

export default function Customers() {
  const { filters } = useApp(),
    navigate = useNavigate(),
    location = useLocation()
  const [search, setSearch] = useState(''),
    [page, setPage] = useState(1),
    term = useDebounced(search)
  const query = useQuery({
    queryKey: ['customers', filters, term, page],
    queryFn: async ({ signal }) => (await getProvider()).customers(filters, term, page, signal),
  })
  return (
    <div className="page-content">
      <div className="section-banner">
        <span className="banner-icon">
          <UsersRound size={25} />
        </span>
        <div>
          <h2>Detrás de cada venta, una relación.</h2>
          <p>Conoce a tus clientes y encuentra su historial en un solo lugar.</p>
        </div>
      </div>
      <section className="card">
        <div className="card-heading">
          <div>
            <h2>
              Directorio de clientes{' '}
              <span className="count-pill">{number(query.data?.total || 0)}</span>
            </h2>
            <p>Clientes con operaciones en el período y canal seleccionados.</p>
          </div>
          <div className="search-field">
            <Search size={17} />
            <input
              aria-label="Buscar clientes"
              placeholder="Buscar nombre o correo…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>
        {query.isPending ? (
          <Loading />
        ) : query.error ? (
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        ) : !query.data.total ? (
          <EmptyState
            title="No encontramos clientes"
            description="Prueba con otro nombre o ajusta los filtros."
          />
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <caption className="sr-only">Clientes ordenados por ingresos cobrados</caption>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Correo</th>
                    <th>Operaciones</th>
                    <th>Ingresos cobrados</th>
                    <th>Última operación</th>
                    <th>
                      <span className="sr-only">Historial</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.rows.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="customer-cell">
                          <span className="avatar">{initials(c.name)}</span>
                          <strong>{c.name}</strong>
                        </div>
                      </td>
                      <td>{c.email}</td>
                      <td>{c.orders}</td>
                      <td className="amount">{money(c.revenueCents)}</td>
                      <td>{dateLabel(c.lastOrder)}</td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`Ver historial de ${c.name}`}
                          onClick={() => {
                            const params = new URLSearchParams(location.search)
                            params.set('q', c.email)
                            params.set('status', 'Todos')
                            params.set('page', '1')
                            navigate(`/ventas?${params}`)
                          }}
                        >
                          <ArrowUpRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>{number(query.data.total)} clientes · ordenados por ingresos</span>
              <div>
                <button
                  aria-label="Clientes anteriores"
                  className="icon-button"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={18} />
                </button>
                <span>
                  {page} / {Math.max(1, Math.ceil(query.data.total / 12))}
                </span>
                <button
                  aria-label="Clientes siguientes"
                  className="icon-button"
                  disabled={page * 12 >= query.data.total}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      <p className="method-note">
        Las operaciones incluyen todos los estados. Solo las pagadas aportan a los ingresos. Todos
        los perfiles del demo son ficticios.
      </p>
    </div>
  )
}
