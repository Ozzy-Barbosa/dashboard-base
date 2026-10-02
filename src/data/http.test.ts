import { afterEach, describe, expect, it, vi } from 'vitest'
import { httpProvider } from './http'
import type { Filters } from '../domain/models'
const filters: Filters = {
  businessId: 'comercio',
  start: '2026-09-01',
  end: '2026-09-30',
  channel: 'Todos',
}
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})
describe('Contrato HTTP', () => {
  it('rechaza API sin configuración', async () => {
    vi.stubEnv('VITE_API_URL', '')
    await expect(httpProvider.summary(filters)).rejects.toThrow('Falta configurar')
  })
  it('rechaza un origen público sin HTTPS', async () => {
    vi.stubEnv('VITE_API_URL', 'http://example.com/v1/')
    await expect(httpProvider.summary(filters)).rejects.toThrow('HTTPS')
  })
  it('hace visible una sesión terminada', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.com/v1/')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })))
    await expect(httpProvider.summary(filters)).rejects.toThrow('Tu sesión terminó')
  })
  it('valida las respuestas antes de mostrarlas', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.com/v1/')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ broken: true }), { status: 200 }))
    )
    await expect(httpProvider.summary(filters)).rejects.toThrow('formato inesperado')
  })
})
