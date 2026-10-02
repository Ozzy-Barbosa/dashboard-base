const moneyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})
const exactFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})
const numberFormatter = new Intl.NumberFormat('es-MX')
export const money = (cents: number) => moneyFormatter.format(cents / 100)
export const exactMoney = (cents: number) => exactFormatter.format(cents / 100)
export const number = (value: number) => numberFormatter.format(value)
export const shortMoney = (cents: number) =>
  new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 1 }).format(
    cents / 100
  )
export const dateLabel = (iso: string) =>
  new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${iso}T12:00:00Z`)
  )
export const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
export function delta(current: number, previous: number): number | null {
  return previous === 0 ? null : ((current - previous) / previous) * 100
}
export function shiftDate(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
export const daysBetween = (start: string, end: string) =>
  Math.round((Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86400000) + 1
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
