import { Component, useEffect, useRef, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle, ArrowDown, ArrowUp, Inbox, RefreshCw, X } from 'lucide-react'
import type { OrderStatus } from '../domain/models'
import { delta } from '../lib/format'

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <span />
      {status}
    </span>
  )
}
export function Change({ current, previous }: { current: number; previous: number }) {
  const change = delta(current, previous)
  if (change === null) return <span className="change neutral">Sin base anterior</span>
  const Icon = change >= 0 ? ArrowUp : ArrowDown
  return (
    <span className={`change ${change < 0 ? 'negative' : ''}`}>
      <Icon size={12} aria-hidden="true" />
      {Math.abs(change).toFixed(1)}%
    </span>
  )
}
export function Loading({ label = 'Cargando información…' }: { label?: string }) {
  return (
    <div className="loading-block" role="status">
      <div className="skeleton sk-title" />
      <div className="skeleton sk-line" />
      <div className="skeleton sk-chart" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
export function ErrorState({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <AlertCircle size={30} />
      <h3>No pudimos cargar la información</h3>
      <p>{error.message}</p>
      <button className="button" onClick={retry}>
        <RefreshCw size={16} />
        Volver a intentar
      </button>
    </div>
  )
}
export function EmptyState({
  title = 'No hay resultados',
  description = 'Prueba con otro período o cambia los filtros.',
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <Inbox size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}
export function Dialog({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = ref.current
    element?.showModal()
    return () => element?.close()
  }, [])
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={onClose}
      className={wide ? 'dialog wide' : 'dialog'}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect()
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose()
        }
      }}
    >
      <div className="dialog-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Cerrar ventana">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  )
}
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Pulso UI error', error.message, info.componentStack)
  }
  render() {
    return this.state.failed ? (
      <div className="fatal-error">
        <h1>Volvamos a intentarlo</h1>
        <p>Ocurrió un error inesperado al mostrar el dashboard.</p>
        <button className="button primary" onClick={() => window.location.reload()}>
          Recargar Pulso
        </button>
      </div>
    ) : (
      this.props.children
    )
  }
}
