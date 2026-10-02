import { useState } from 'react'
import { Download, FileBarChart2, FileSpreadsheet, ShoppingBag } from 'lucide-react'
import { useApp, useSummary } from '../../app/context'
import { getProvider } from '../../data/provider'
import { downloadCsv, ordersCsv, toCsv } from '../../lib/csv'
import { dateLabel, exactMoney } from '../../lib/format'
import { ErrorState, Loading } from '../../components/ui'

export default function Reports() {
  const { filters, notify } = useApp(),
    query = useSummary(),
    [busy, setBusy] = useState(false)
  if (query.isPending) return <Loading />
  if (query.error) return <ErrorState error={query.error} retry={() => void query.refetch()} />
  const data = query.data
  const suffix = `${filters.businessId}-${filters.start}-${filters.end}`
  const meta = [
    ['Negocio', filters.businessId],
    ['Inicio', filters.start],
    ['Fin', filters.end],
    ['Canal', filters.channel],
    ['Moneda', 'MXN'],
    [],
  ]
  function exportSummary() {
    downloadCsv(
      toCsv([
        ...meta,
        ['Métrica', 'Actual', 'Anterior'],
        [
          'Ingresos cobrados MXN',
          (data.current.revenueCents / 100).toFixed(2),
          (data.previous.revenueCents / 100).toFixed(2),
        ],
        ['Ventas pagadas', data.current.paidCount, data.previous.paidCount],
        ['Clientes activos', data.current.activeCustomers, data.previous.activeCustomers],
        [
          'Ticket promedio MXN',
          (data.current.ticketCents / 100).toFixed(2),
          (data.previous.ticketCents / 100).toFixed(2),
        ],
        [
          'Por cobrar MXN',
          (data.current.pendingCents / 100).toFixed(2),
          (data.previous.pendingCents / 100).toFixed(2),
        ],
      ]),
      `pulso-resumen-${suffix}.csv`
    )
    notify('Resumen exportado.')
  }
  async function exportOrders() {
    setBusy(true)
    try {
      const rows = await (
        await getProvider()
      ).exportOrders({
        ...filters,
        page: 1,
        pageSize: 100,
        search: '',
        status: 'Todos',
        sort: 'date',
        direction: 'desc',
      })
      downloadCsv(ordersCsv(rows), `pulso-ventas-${suffix}.csv`)
      notify(`${rows.length} ventas exportadas.`)
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Error de exportación', 'error')
    } finally {
      setBusy(false)
    }
  }
  function exportChannels() {
    downloadCsv(
      toCsv([
        ...meta,
        ['Canal', 'Ingresos MXN', 'Ventas pagadas'],
        ...data.channels.map((c) => [c.name, (c.revenueCents / 100).toFixed(2), c.count]),
      ]),
      `pulso-canales-${suffix}.csv`
    )
    notify('Reporte de canales exportado.')
  }
  const cards = [
    {
      icon: FileBarChart2,
      title: 'Resumen ejecutivo',
      description: 'Los indicadores clave y su comparación con el período anterior.',
      action: exportSummary,
      label: 'Descargar resumen',
    },
    {
      icon: ShoppingBag,
      title: 'Detalle de ventas',
      description: 'Cada operación del período, con cliente, concepto, importe y estado.',
      action: () => void exportOrders(),
      label: busy ? 'Preparando…' : 'Descargar ventas',
    },
    {
      icon: FileSpreadsheet,
      title: 'Rendimiento por canal',
      description: 'Ingresos y ventas pagadas agrupados por cada canal comercial.',
      action: exportChannels,
      label: 'Descargar canales',
    },
  ]
  return (
    <div className="page-content">
      <div className="section-banner">
        <span className="banner-icon">
          <FileBarChart2 size={25} />
        </span>
        <div>
          <h2>La información correcta, lista para compartir.</h2>
          <p>
            Reportes del {dateLabel(filters.start)} al {dateLabel(filters.end)} ·{' '}
            {filters.channel === 'Todos' ? 'Todos los canales' : filters.channel} ·{' '}
            {filters.end.slice(0, 4)}
          </p>
        </div>
      </div>
      <div className="report-grid">
        {cards.map((c) => (
          <article className="card report-card" key={c.title}>
            <span className="report-icon">
              <c.icon size={24} />
            </span>
            <span className="small-tag">CSV · EXCEL COMPATIBLE</span>
            <h2>{c.title}</h2>
            <p>{c.description}</p>
            <button className="button" onClick={c.action} disabled={busy}>
              <Download size={16} />
              {c.label}
            </button>
          </article>
        ))}
      </div>
      <section className="card report-preview">
        <div className="card-heading">
          <div>
            <h2>Vista previa del resumen</h2>
            <p>Valores exactos del período actual.</p>
          </div>
          <span className="small-tag">MXN</span>
        </div>
        <dl>
          <div>
            <dt>Ingresos cobrados</dt>
            <dd>{exactMoney(data.current.revenueCents)}</dd>
          </div>
          <div>
            <dt>Ventas pagadas</dt>
            <dd>{data.current.paidCount}</dd>
          </div>
          <div>
            <dt>Ticket promedio</dt>
            <dd>{exactMoney(data.current.ticketCents)}</dd>
          </div>
          <div>
            <dt>Importe pendiente</dt>
            <dd>{exactMoney(data.current.pendingCents)}</dd>
          </div>
        </dl>
      </section>
      <p className="method-note">
        Los archivos respetan el período y canal seleccionados. Este prototipo no genera facturas ni
        estados contables.
      </p>
    </div>
  )
}
