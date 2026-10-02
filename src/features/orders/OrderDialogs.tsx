import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Check, Mail, ShoppingBag, UserRound } from 'lucide-react'
import { useApp } from '../../app/context'
import { getProvider, isDemo } from '../../data/provider'
import {
  channels,
  newOrderSchema,
  statuses,
  type NewOrder,
  type Order,
  type OrderStatus,
} from '../../domain/models'

import { dateLabel, exactMoney } from '../../lib/format'
import { Dialog, StatusBadge } from '../../components/ui'

export function NewOrderDialog({ onClose }: { onClose: () => void }) {
  const { business, notify, referenceDate } = useApp(),
    queryClient = useQueryClient()
  const [validation, setValidation] = useState('')
  const mutation = useMutation({
    mutationFn: async (input: NewOrder) => (await getProvider()).createOrder(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries()
      notify('Venta registrada. Los indicadores ya están actualizados.')
      onClose()
    },
  })
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setValidation('')
    const form = new FormData(e.currentTarget)
    const result = newOrderSchema.safeParse({
      businessId: business.id,
      customerName: String(form.get('name')).trim(),
      customerEmail: String(form.get('email')).trim().toLowerCase(),
      product: form.get('product'),
      quantity: Number(form.get('quantity')),
      amountCents: Math.round(Number(form.get('amount')) * 100),
      date: form.get('date'),
      channel: form.get('channel'),
      status: form.get('status'),
    })
    if (!result.success) {
      setValidation(result.error.issues.map((i) => i.message).join('. '))
      return
    }
    mutation.mutate(result.data)
  }
  return (
    <Dialog
      title="Nueva venta"
      subtitle={
        isDemo
          ? 'Registro de demostración · se guarda en este navegador.'
          : 'Registra una operación en tu negocio.'
      }
      onClose={() => {
        if (!mutation.isPending) onClose()
      }}
    >
      <form onSubmit={submit} className="form-stack">
        <div className="form-grid">
          <label>
            Nombre del cliente
            <input
              name="name"
              required
              minLength={2}
              maxLength={80}
              placeholder="Ej. Andrea Moreno"
              autoComplete="off"
            />
          </label>
          <label>
            Correo del cliente
            <input
              name="email"
              type="email"
              required
              placeholder="andrea@ejemplo.com"
              autoComplete="off"
            />
          </label>
        </div>
        <label>
          Producto o servicio
          <select name="product">
            {business.products.map((p) => (
              <option key={p.name}>{p.name}</option>
            ))}
          </select>
        </label>
        <div className="form-grid">
          <label>
            Total de la venta (MXN)
            <input
              name="amount"
              type="number"
              required
              min="0.01"
              max="10000000"
              step="0.01"
              placeholder="0.00"
            />
          </label>
          <label>
            Cantidad
            <input
              name="quantity"
              type="number"
              required
              min="1"
              max="10000"
              step="1"
              defaultValue="1"
            />
          </label>
        </div>
        <p className="field-help">
          El total incluye todas las unidades. El correo identifica al cliente; si ya existe, se
          conserva su nombre.
        </p>
        <div className="form-grid">
          <label>
            Fecha
            <input name="date" type="date" required defaultValue={referenceDate} />
          </label>
          <label>
            Canal
            <select name="channel">
              {channels.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Estado
          <select name="status" aria-label="Estado">
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        {isDemo && (
          <p className="form-note">
            El demo muestra períodos hasta el 30 sep 2026. Una venta fuera del período seguirá
            guardada, pero no aparecerá en los filtros actuales.
          </p>
        )}
        {(validation || mutation.error) && (
          <p role="alert" className="form-error">
            {validation || mutation.error?.message}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </button>
          <button className="button primary" disabled={mutation.isPending}>
            <Check size={16} />
            {mutation.isPending ? 'Guardando…' : 'Guardar venta'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
export function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  const { notify } = useApp(),
    client = useQueryClient()
  const [current, setCurrent] = useState(order)
  const [nextStatus, setNextStatus] = useState<OrderStatus>(order.status)
  const mutation = useMutation({
    mutationFn: async () =>
      (await getProvider()).updateStatus(order.businessId, order.id, nextStatus),
    onSuccess: async (value) => {
      setCurrent(value)
      await client.invalidateQueries()
      notify('Estado actualizado. Los ingresos se recalcularon.')
    },
  })
  return (
    <Dialog
      title={`Venta ${order.id}`}
      subtitle="Detalle de la operación"
      onClose={() => {
        if (!mutation.isPending) onClose()
      }}
    >
      <div className="detail-total">
        <div>
          <span>Total · MXN</span>
          <strong>{exactMoney(current.amountCents)}</strong>
        </div>
        <StatusBadge status={current.status} />
      </div>
      <dl className="detail-list">
        <div>
          <dt>
            <UserRound size={16} />
            Cliente
          </dt>
          <dd>{current.customerName}</dd>
        </div>
        <div>
          <dt>
            <Mail size={16} />
            Correo
          </dt>
          <dd>{current.customerEmail}</dd>
        </div>
        <div>
          <dt>
            <ShoppingBag size={16} />
            Concepto
          </dt>
          <dd>
            {current.quantity} × {current.product}
          </dd>
        </div>
        <div>
          <dt>
            <CalendarDays size={16} />
            Fecha / canal
          </dt>
          <dd>
            {dateLabel(current.date)} {current.date.slice(0, 4)} · {current.channel}
          </dd>
        </div>
      </dl>
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate()
        }}
      >
        <label>
          Actualizar estado
          <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as OrderStatus)}>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <p className="field-help">
          Solo las ventas pagadas suman a los ingresos. Este cambio no realiza cobros ni
          devoluciones.
        </p>
        {mutation.error && (
          <p role="alert" className="form-error">
            {mutation.error.message}
          </p>
        )}
        <button
          className="button primary"
          disabled={nextStatus === current.status || mutation.isPending}
        >
          {mutation.isPending ? 'Actualizando…' : 'Guardar estado'}
        </button>
      </form>
    </Dialog>
  )
}
