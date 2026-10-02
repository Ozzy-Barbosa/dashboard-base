import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { businessIdSchema, channels, type Filters } from '../domain/models'
import { businesses, DEMO_TODAY } from '../config/businesses'
import { shiftDate } from '../lib/format'
import { getProvider, isDemo } from '../data/provider'

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  accent: z.enum(['green', 'blue', 'violet']),
  businesses: z.record(
    z.string(),
    z.object({
      name: z.string().min(2).max(40),
      goalCents: z.number().int().min(100).max(10_000_000_000),
    })
  ),
})
export type Preferences = z.infer<typeof preferencesSchema>
const defaults: Preferences = { theme: 'light', accent: 'green', businesses: {} }
function readPreferences() {
  try {
    return preferencesSchema.parse(
      JSON.parse(localStorage.getItem('pulso.preferences.v1') || 'null')
    )
  } catch {
    return defaults
  }
}
function useAppState() {
  const [params, setParams] = useSearchParams()
  const businessId = businessIdSchema.catch('comercio').parse(params.get('business'))
  const days = [7, 30, 90].includes(Number(params.get('days'))) ? Number(params.get('days')) : 30
  const rawChannel = params.get('channel')
  const channel = channels.find((c) => c === rawChannel) || 'Todos'
  const referenceDate = isDemo
    ? DEMO_TODAY
    : new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Mazatlan' }).format(new Date())
  const filters: Filters = {
    businessId,
    start: shiftDate(referenceDate, -(days - 1)),
    end: referenceDate,
    channel,
  }
  const [preferences, setPreferences] = useState<Preferences>(readPreferences)
  const [toast, setToast] = useState('')
  const [toastTone, setToastTone] = useState<'success' | 'error'>('success')
  const business = { ...businesses[businessId], ...preferences.businesses[businessId] }
  useEffect(() => {
    const match = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      document.documentElement.dataset.theme =
        preferences.theme === 'system' ? (match.matches ? 'dark' : 'light') : preferences.theme
      document.documentElement.dataset.accent = preferences.accent
    }
    apply()
    match.addEventListener('change', apply)
    return () => match.removeEventListener('change', apply)
  }, [preferences.theme, preferences.accent])
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [toast])
  function updateFilters(values: Record<string, string>) {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(values)) next.set(key, value)
      return next
    })
  }
  function savePreferences(value: Preferences) {
    const parsed = preferencesSchema.parse(value)
    localStorage.setItem('pulso.preferences.v1', JSON.stringify(parsed))
    setPreferences(parsed)
    notify('Preferencias guardadas en este navegador.')
  }
  function notify(message: string, tone: 'success' | 'error' = 'success') {
    setToastTone(tone)
    setToast(message)
  }
  return {
    filters,
    days,
    referenceDate,
    business,
    preferences,
    savePreferences,
    updateFilters,
    toast,
    toastTone,
    notify,
  }
}
const AppContext = createContext<ReturnType<typeof useAppState> | null>(null)
export function AppProvider({ children }: { children: ReactNode }) {
  const value = useAppState()
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error('AppProvider requerido')
  return value
}
export function useSummary() {
  const { filters } = useApp()
  return useQuery({
    queryKey: ['summary', filters],
    queryFn: async ({ signal }) => (await getProvider()).summary(filters, signal),
  })
}
export function useDebounced<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
