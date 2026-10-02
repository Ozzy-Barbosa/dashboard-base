import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Command,
  Download,
  LayoutDashboard,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShoppingBag,
  Sparkles,
  Store,
  UsersRound,
  X,
} from 'lucide-react'
import { useApp, useSummary } from './context'
import { businesses } from '../config/businesses'
import { channels } from '../domain/models'
import { isDemo } from '../data/provider'
import { dateLabel, money } from '../lib/format'
import { Dialog, ErrorBoundary, ErrorState, Loading } from '../components/ui'
import { NewOrderDialog } from '../features/orders/OrderDialogs'

const Overview = lazy(() => import('../features/overview/Overview'))
const Orders = lazy(() => import('../features/orders/Orders'))
const Customers = lazy(() => import('../features/customers/Customers'))
const Reports = lazy(() => import('../features/reports/Reports'))
const Settings = lazy(() => import('../features/settings/Settings'))
const navigation = [
  {
    path: '/',
    label: 'Resumen',
    icon: LayoutDashboard,
    title: 'Tu negocio, en perspectiva.',
    description: 'Todo lo que necesitas saber para dar el siguiente paso.',
  },
  {
    path: '/ventas',
    label: 'Ventas',
    icon: ShoppingBag,
    title: 'Cada venta cuenta.',
    description: 'El control de tus operaciones, sin perder de vista lo importante.',
  },
  {
    path: '/clientes',
    label: 'Clientes',
    icon: UsersRound,
    title: 'Conoce a quienes te eligen.',
    description: 'Una mirada más cercana a las personas detrás de tus resultados.',
  },
  {
    path: '/reportes',
    label: 'Reportes',
    icon: ChartNoAxesCombined,
    title: 'De los datos a las decisiones.',
    description: 'Convierte el desempeño de tu negocio en información compartible.',
  },
  {
    path: '/configuracion',
    label: 'Configuración',
    icon: Settings2,
    title: 'A tu manera.',
    description: 'Personaliza tu espacio y prepara la base para tu próximo negocio.',
  },
]

function QuickSearch({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState(''),
    navigate = useNavigate(),
    { search } = useLocation()
  function go(path: string) {
    navigate({ pathname: path, search })
    onClose()
  }
  return (
    <Dialog
      title="Buscar en Pulso"
      subtitle="Encuentra una sección o busca una venta."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const params = new URLSearchParams(search)
          params.set('q', value)
          params.set('page', '1')
          params.set('status', 'Todos')
          navigate(`/ventas?${params}`, { state: { searchRequest: crypto.randomUUID() } })
          onClose()
        }}
        className="quick-search-form"
      >
        <div className="search-field">
          <Search size={19} />
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Cliente, concepto o folio…"
            aria-label="Búsqueda global"
          />
          <button type="submit" className="icon-button" aria-label="Buscar en ventas">
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
      <div className="quick-links">
        {navigation
          .filter((item) => item.label.toLowerCase().includes(value.toLowerCase()))
          .map((item) => (
            <button key={item.path} onClick={() => go(item.path)}>
              <item.icon size={18} />
              {item.label}
              <ArrowUpRight size={16} />
            </button>
          ))}
      </div>
      {value && (
        <p className="field-help">
          Presiona Enter para buscar “{value}” en las ventas del período actual.
        </p>
      )}
    </Dialog>
  )
}

export default function App() {
  const { business, filters, days, updateFilters, toast, toastTone, notify } = useApp(),
    location = useLocation(),
    navigate = useNavigate(),
    client = useQueryClient()
  const [mobileOpen, setMobileOpen] = useState(false),
    [newOrder, setNewOrder] = useState(false),
    [searchOpen, setSearchOpen] = useState(false),
    [notificationsOpen, setNotificationsOpen] = useState(false),
    [helpOpen, setHelpOpen] = useState(false),
    [refreshing, setRefreshing] = useState(false)
  const summary = useSummary(),
    mainRef = useRef<HTMLElement>(null)
  const current = navigation.find((n) => n.path === location.pathname) || navigation[0]
  useEffect(() => {
    document.title = `${current.label} · ${business.name} · Pulso`
  }, [current.label, business.name])
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])
  async function refresh() {
    setRefreshing(true)
    try {
      await client.invalidateQueries({}, { throwOnError: true })
      notify('Información actualizada.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'No se pudo actualizar.', 'error')
    } finally {
      setRefreshing(false)
    }
  }
  function closeMobile() {
    setMobileOpen(false)
  }
  const navContent = (
    <>
      <NavLink
        className="brand"
        to={{ pathname: '/', search: location.search }}
        onClick={closeMobile}
        aria-label="Pulso, inicio"
      >
        <span className="brand-mark">
          <Activity size={24} strokeWidth={2.3} />
        </span>
        <span>
          pulso<span className="brand-dot">.</span>
        </span>
      </NavLink>
      <div className="workspace-switch">
        <span className="workspace-initials">{business.initials}</span>
        <div>
          <span className="workspace-caption">ESPACIO DE TRABAJO</span>
          <label>
            <span className="sr-only">Cambiar negocio</span>
            <select
              aria-label="Cambiar negocio"
              value={business.id}
              onChange={(e) => {
                updateFilters({ business: e.target.value, page: '1', q: '', status: 'Todos' })
                closeMobile()
              }}
            >
              {Object.values(businesses).map((b) => (
                <option value={b.id} key={b.id}>
                  {b.id === business.id ? business.name : b.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ChevronDown size={15} />
      </div>
      <div className="nav-section-label">PRINCIPAL</div>
      <nav aria-label="Navegación principal">
        {navigation.slice(0, 4).map((item) => (
          <NavLink
            key={item.path}
            end={item.path === '/'}
            to={{ pathname: item.path, search: location.search }}
            onClick={closeMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={19} />
            <span>{item.label}</span>
            {item.path === '/reportes' && <span className="nav-tag">CSV</span>}
          </NavLink>
        ))}
      </nav>
      <div className="nav-section-label tools-label">TU ESPACIO</div>
      <NavLink
        to={{ pathname: '/configuracion', search: location.search }}
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        onClick={closeMobile}
      >
        <Settings2 size={19} />
        Configuración
      </NavLink>
      <button
        className="nav-item"
        onClick={() => {
          closeMobile()
          setHelpOpen(true)
        }}
      >
        <CircleHelp size={19} />
        Guía rápida
      </button>
      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <span>
            <Sparkles size={17} />
            Una base, muchas posibilidades
          </span>
          <p>Explora. Adapta. Construye el siguiente dashboard.</p>
          <a href="https://github.com/Ozzy-Barbosa/dashboard-base" target="_blank" rel="noreferrer">
            Explorar el proyecto <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="sidebar-profile">
          <span className="profile-avatar">P</span>
          <div>
            <strong>Espacio de {isDemo ? 'demostración' : 'trabajo'}</strong>
            <small>Pulso · Dashboard base</small>
          </div>
          <span className="profile-status" />
        </div>
      </div>
    </>
  )
  return (
    <ErrorBoundary>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          mainRef.current?.focus()
        }}
      >
        Saltar al contenido
      </a>
      <div className="app-shell">
        <aside className="sidebar">{navContent}</aside>
        {mobileOpen && (
          <Dialog title="Menú principal" onClose={closeMobile}>
            <div className="mobile-navigation">{navContent}</div>
          </Dialog>
        )}
        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="icon-button mobile-menu"
                aria-label="Abrir menú"
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={21} />
              </button>
              <span className="breadcrumb-workspace">Mi espacio</span>
              <span className="breadcrumb-slash">/</span>
              <strong>{current.label}</strong>
            </div>
            <div className="topbar-actions">
              <button
                aria-label="Buscar en Pulso"
                className="global-search"
                onClick={() => setSearchOpen(true)}
              >
                <Search size={16} />
                <span>Buscar en Pulso</span>
                <kbd>
                  <Command size={11} /> K
                </kbd>
              </button>
              <span className="topbar-divider" />
              <button
                className="icon-button notification-button"
                aria-label="Ver pendientes"
                onClick={() => setNotificationsOpen(true)}
              >
                <Bell size={19} />
                {!!summary.data?.current.pendingCount && <i />}
              </button>
              <span className="topbar-avatar" aria-label="Perfil de demostración">
                {business.initials}
              </span>
            </div>
          </header>
          <main id="main" tabIndex={-1} ref={mainRef}>
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  <span />
                  {isDemo
                    ? 'UNA VISTA CLARA. MEJORES DECISIONES.'
                    : business.category.toUpperCase()}
                </div>
                <h1>{current.title}</h1>
                <p>{current.description}</p>
              </div>
              <div className="heading-actions">
                {location.pathname !== '/configuracion' && (
                  <>
                    <button
                      className="button export-heading"
                      onClick={() => navigate({ pathname: '/reportes', search: location.search })}
                    >
                      <Download size={16} />
                      Reportes
                    </button>
                    <button className="button primary" onClick={() => setNewOrder(true)}>
                      <Plus size={17} />
                      Nueva venta
                    </button>
                  </>
                )}
              </div>
            </div>
            {location.pathname !== '/configuracion' && (
              <div className="filters-bar">
                <div className="filter-controls">
                  <label className="filter-control">
                    <CalendarDays size={16} />
                    <span className="sr-only">Período</span>
                    <select
                      aria-label="Período"
                      value={days}
                      onChange={(e) => updateFilters({ days: e.target.value, page: '1' })}
                    >
                      <option value="7">Últimos 7 días</option>
                      <option value="30">Últimos 30 días</option>
                      <option value="90">Últimos 90 días</option>
                    </select>
                  </label>
                  <label className="filter-control">
                    <Store size={16} />
                    <span className="sr-only">Canal de venta</span>
                    <select
                      aria-label="Canal de venta"
                      value={filters.channel}
                      onChange={(e) => updateFilters({ channel: e.target.value, page: '1' })}
                    >
                      <option value="Todos">Todos los canales</option>
                      {channels.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <span className="date-range">
                    {dateLabel(filters.start)} – {dateLabel(filters.end)}, {filters.end.slice(0, 4)}
                  </span>
                </div>
                <button
                  className="refresh-button"
                  onClick={() => void refresh()}
                  disabled={refreshing}
                  aria-label="Actualizar información"
                >
                  <span className="fresh-dot" />
                  {refreshing ? 'Actualizando…' : 'Actualizar'}
                  <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
                </button>
              </div>
            )}
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/" element={<Overview />} />
                <Route
                  path="/ventas"
                  element={
                    <Orders
                      key={`${filters.businessId}-${days}-${filters.channel}-${location.state?.searchRequest || ''}`}
                    />
                  }
                />
                <Route
                  path="/clientes"
                  element={<Customers key={`${filters.businessId}-${days}-${filters.channel}`} />}
                />
                <Route path="/reportes" element={<Reports />} />
                <Route path="/configuracion" element={<Settings key={filters.businessId} />} />
                <Route
                  path="*"
                  element={<Navigate to={{ pathname: '/', search: location.search }} replace />}
                />
              </Routes>
            </Suspense>
            <footer className="app-footer">
              <span>
                <Activity size={13} />
                Pulso <i /> Tu negocio, en perspectiva.
              </span>
              <span>
                {isDemo ? 'Datos ficticios · corte al 30 sep 2026' : 'Datos de tu proveedor API'}
                <b>v1.0</b>
              </span>
            </footer>
          </main>
        </div>
      </div>
      <div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">
        {toast && (
          <>
            {toastTone === 'error' ? <AlertCircle size={19} /> : <CheckCircle2 size={19} />}
            <span>{toast}</span>
            <button className="icon-button" aria-label="Cerrar aviso" onClick={() => notify('')}>
              <X size={15} />
            </button>
          </>
        )}
      </div>
      {isDemo && (
        <div className="demo-indicator">
          <span />
          DEMO INTERACTIVO
        </div>
      )}
      {newOrder && <NewOrderDialog key={business.id} onClose={() => setNewOrder(false)} />}
      {searchOpen && <QuickSearch onClose={() => setSearchOpen(false)} />}
      {notificationsOpen && (
        <Dialog
          title="Pendientes del período"
          subtitle="Operaciones que requieren tu atención."
          onClose={() => setNotificationsOpen(false)}
        >
          {summary.isPending ? (
            <Loading />
          ) : summary.error ? (
            <ErrorState error={summary.error} retry={() => void summary.refetch()} />
          ) : (
            <div className="pending-card">
              <span className="report-icon">
                <Bell size={23} />
              </span>
              <strong>{summary.data?.current.pendingCount || 0} ventas por cobrar</strong>
              <p>
                {money(summary.data?.current.pendingCents || 0)} pendientes en el período y canal
                seleccionados.
              </p>
              <button
                className="button primary"
                onClick={() => {
                  const params = new URLSearchParams(location.search)
                  params.set('status', 'Pendiente')
                  params.set('q', '')
                  params.set('page', '1')
                  navigate(`/ventas?${params}`, { state: { searchRequest: crypto.randomUUID() } })
                  setNotificationsOpen(false)
                }}
              >
                Revisar ventas pendientes <ArrowRight size={16} />
              </button>
            </div>
          )}
        </Dialog>
      )}
      {helpOpen && (
        <Dialog
          title="Bienvenido a Pulso"
          subtitle="Una vista clara para tomar mejores decisiones."
          onClose={() => setHelpOpen(false)}
        >
          <ol className="help-list">
            <li>
              <strong>Elige un negocio de ejemplo.</strong>
              <p>El selector del menú cambia entre comercio, servicios y cafetería.</p>
            </li>
            <li>
              <strong>Explora un período y un canal.</strong>
              <p>Los indicadores, clientes, gráficos y reportes responden a los mismos filtros.</p>
            </li>
            <li>
              <strong>Prueba una operación completa.</strong>
              <p>Agrega una venta, cambia su estado y observa cómo cambian los ingresos.</p>
            </li>
            <li>
              <strong>Hazlo tuyo.</strong>
              <p>Personaliza nombre, meta, color y tema desde Configuración.</p>
            </li>
          </ol>
          <p className="form-note">
            En modo demo, los cambios quedan en este navegador. No introduzcas información personal
            real. La guía del proyecto explica cómo conectar un negocio real.
          </p>
          <a
            className="button primary"
            href="https://github.com/Ozzy-Barbosa/dashboard-base/blob/main/docs/GUIA-DE-ESTUDIO.md"
            target="_blank"
            rel="noreferrer"
          >
            Abrir guía de estudio <ArrowUpRight size={16} />
          </a>
        </Dialog>
      )}
    </ErrorBoundary>
  )
}
