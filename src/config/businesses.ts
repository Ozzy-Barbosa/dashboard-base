import type { BusinessId } from '../domain/models'

export interface BusinessConfig {
  id: BusinessId
  name: string
  category: string
  initials: string
  goalCents: number
  products: { name: string; priceCents: number }[]
}
export const businesses: Record<BusinessId, BusinessConfig> = {
  comercio: {
    id: 'comercio',
    name: 'Casa Norte',
    category: 'Comercio & estilo de vida',
    initials: 'CN',
    goalCents: 65_000_000,
    products: [
      { name: 'Lámpara de mesa', priceCents: 89000 },
      { name: 'Set de cerámica', priceCents: 68000 },
      { name: 'Textil de algodón', priceCents: 45000 },
      { name: 'Silla de madera', priceCents: 149000 },
      { name: 'Florero artesanal', priceCents: 39000 },
      { name: 'Organizador natural', priceCents: 28000 },
    ],
  },
  servicios: {
    id: 'servicios',
    name: 'Estudio Sur',
    category: 'Servicios profesionales',
    initials: 'ES',
    goalCents: 190_000_000,
    products: [
      { name: 'Asesoría inicial', priceCents: 150000 },
      { name: 'Sesión de estrategia', priceCents: 280000 },
      { name: 'Diseño de identidad', priceCents: 650000 },
      { name: 'Plan de contenido', priceCents: 320000 },
      { name: 'Soporte mensual', priceCents: 180000 },
    ],
  },
  cafeteria: {
    id: 'cafeteria',
    name: 'Café Bruma',
    category: 'Alimentos & bebidas',
    initials: 'CB',
    goalCents: 9_000_000,
    products: [
      { name: 'Café de especialidad', priceCents: 6500 },
      { name: 'Desayuno de la casa', priceCents: 18500 },
      { name: 'Pan artesanal', priceCents: 5500 },
      { name: 'Bebida de temporada', priceCents: 8500 },
      { name: 'Bolsa de café 250 g', priceCents: 22000 },
    ],
  },
}
export const DEMO_TODAY = '2026-09-30'
