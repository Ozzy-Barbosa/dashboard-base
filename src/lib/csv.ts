import type { Order } from '../domain/models'

export function csvCell(value: string | number): string {
  const text = String(value)
  // Treat spreadsheet formula prefixes (including leading control/space) as text.
  const safe = /^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}
export const toCsv = (rows: (string | number)[][]) =>
  '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
export function ordersCsv(orders: Order[]) {
  return toCsv([
    ['ID', 'Fecha', 'Cliente', 'Email', 'Concepto', 'Cantidad', 'Total MXN', 'Canal', 'Estado'],
    ...orders.map((o) => [
      o.id,
      o.date,
      o.customerName,
      o.customerEmail,
      o.product,
      o.quantity,
      (o.amountCents / 100).toFixed(2),
      o.channel,
      o.status,
    ]),
  ])
}
export function downloadCsv(content: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
