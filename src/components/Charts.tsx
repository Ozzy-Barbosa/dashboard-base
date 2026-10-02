import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChartNoAxesCombined } from 'lucide-react'
import type { Summary } from '../domain/models'
import { exactMoney, money, shortMoney } from '../lib/format'

export function RevenueChart({ summary }: { summary: Summary }) {
  const [showPrevious, setShowPrevious] = useState(true)
  const [active, setActive] = useState<number | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(760)
  useEffect(() => {
    const element = chartRef.current
    if (!element) return
    const observer = new ResizeObserver((entries) =>
      setWidth(Math.max(280, entries[0].contentRect.width))
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const { series } = summary
  const height = 235,
    left = 48,
    right = 20,
    top = 24,
    bottom = 34
  const max = Math.max(
    ...series.map((s) => Math.max(s.revenueCents, showPrevious ? s.previousCents : 0)),
    100
  )
  const magnitude = 10 ** Math.floor(Math.log10(max))
  const niceMax = Math.ceil(max / magnitude) * magnitude
  const x = (i: number) => left + (i / Math.max(1, series.length - 1)) * (width - left - right)
  const y = (value: number) => height - bottom - (value / niceMax) * (height - top - bottom)
  const line = (key: 'revenueCents' | 'previousCents') =>
    series.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index)},${y(point[key])}`).join(' ')
  const area = `${line('revenueCents')} L${x(series.length - 1)},${height - bottom} L${left},${height - bottom} Z`
  return (
    <section className="card revenue-card">
      <div className="card-heading">
        <div>
          <h2>Evolución de ingresos</h2>
          <p>Un poco de perspectiva para decidir mejor.</p>
        </div>
        <span className="quiet-icon">
          <ChartNoAxesCombined size={19} />
        </span>
      </div>
      <div className="chart-summary">
        <strong>
          {money(summary.current.revenueCents)} <small>MXN</small>
        </strong>
        <div className="chart-legend">
          <span>
            <i className="legend-dot" />
            Período actual
          </span>
          <button
            aria-pressed={showPrevious}
            onClick={() => setShowPrevious(!showPrevious)}
            className={!showPrevious ? 'muted-legend' : ''}
          >
            <i className="legend-line" />
            Período anterior
          </button>
        </div>
      </div>
      <div className="chart-wrap" ref={chartRef}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Ingresos cobrados por intervalo; los valores exactos están disponibles en Ver datos del gráfico."
        >
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity=".19" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <line
                x1={left}
                x2={width - right}
                y1={y((niceMax * i) / 4)}
                y2={y((niceMax * i) / 4)}
                stroke="var(--border)"
                strokeDasharray="3 5"
              />
              <text x={left - 12} y={y((niceMax * i) / 4) + 4} textAnchor="end">
                ${shortMoney((niceMax * i) / 4)}
              </text>
            </g>
          ))}
          {showPrevious && (
            <path
              d={line('previousCents')}
              fill="none"
              stroke="var(--chart-muted)"
              strokeWidth="2"
              strokeDasharray="5 6"
              strokeLinejoin="round"
            />
          )}
          <path d={area} fill="url(#revenue-fill)" />
          <path
            d={line('revenueCents')}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {series.map((point, index) => (
            <g key={index}>
              {index % Math.max(1, Math.ceil((series.length - 1) / (width < 500 ? 3 : 6))) ===
                0 && (
                <text x={x(index)} y={height - 8} textAnchor="middle">
                  {point.label}
                </text>
              )}
              <circle
                cx={x(index)}
                cy={y(point.revenueCents)}
                r={active === index ? 5 : 3}
                fill="var(--card)"
                stroke="var(--accent)"
                strokeWidth="2"
              />
              <rect
                x={x(index) - 15}
                y={top}
                width="30"
                height={height - bottom - top}
                fill="transparent"
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
              >
                <title>
                  {point.label}: {exactMoney(point.revenueCents)}
                </title>
              </rect>
            </g>
          ))}
        </svg>
        {active !== null && (
          <div className="chart-tooltip">
            {series[active].label} · {money(series[active].revenueCents)}
          </div>
        )}
      </div>
      <details className="chart-data">
        <summary>Ver datos del gráfico</summary>
        <p>
          Cada fila agrupa días consecutivos. La comparación usa un período anterior de igual
          duración.
        </p>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">Ingresos por intervalo en MXN</caption>
            <thead>
              <tr>
                <th>Desde</th>
                <th>Actual</th>
                <th>Anterior</th>
              </tr>
            </thead>
            <tbody>
              {series.map((s) => (
                <tr key={s.label}>
                  <td>{s.label}</td>
                  <td>{exactMoney(s.revenueCents)}</td>
                  <td>{exactMoney(s.previousCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}
export function ChannelChart({ summary }: { summary: Summary }) {
  const total = summary.current.revenueCents
  const colors = ['var(--accent)', 'var(--chart-two)', 'var(--chart-three)']
  return (
    <section className="card channel-card">
      <div className="card-heading">
        <div>
          <h2>Ingresos por canal</h2>
          <p>Dónde conecta tu negocio.</p>
        </div>
        <ArrowUpRight size={18} className="text-muted" />
      </div>
      <div className="donut-wrap">
        <svg
          viewBox="0 0 210 170"
          role="img"
          aria-label="Distribución de ingresos por canal, detallada a continuación"
        >
          <circle cx="105" cy="85" r="65" fill="none" stroke="var(--surface)" strokeWidth="21" />
          {summary.channels.map((channel, index) => {
            const portion = total ? (channel.revenueCents / total) * 100 : 0
            const previousOffset = total
              ? summary.channels
                  .slice(0, index)
                  .reduce((sum, c) => sum + (c.revenueCents / total) * 100, 0)
              : 0
            return (
              <circle
                key={channel.name}
                cx="105"
                cy="85"
                r="65"
                fill="none"
                stroke={colors[index]}
                strokeWidth="21"
                pathLength="100"
                strokeDasharray={`${Math.max(0, portion - (portion ? 1.3 : 0))} 100`}
                strokeDashoffset={-previousOffset}
                transform="rotate(-90 105 85)"
              />
            )
          })}
          <text x="105" y="80" textAnchor="middle" className="donut-number">
            {total ? '100%' : '0%'}
          </text>
          <text x="105" y="102" textAnchor="middle" className="donut-label">
            de tus ingresos
          </text>
        </svg>
      </div>
      <ul className="channel-list">
        {summary.channels.map((channel, index) => (
          <li key={channel.name}>
            <span>
              <i style={{ background: colors[index] }} />
              {channel.name}
            </span>
            <strong>{money(channel.revenueCents)}</strong>
            <small>{total ? ((channel.revenueCents / total) * 100).toFixed(0) : 0}%</small>
          </li>
        ))}
      </ul>
    </section>
  )
}
