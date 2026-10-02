import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, CheckCheck, Database, Moon, Palette, ShieldCheck, Sun } from 'lucide-react'
import { useApp, type Preferences } from '../../app/context'
import { isDemo } from '../../data/provider'
import { Dialog } from '../../components/ui'

export default function Settings() {
  const { business, preferences, savePreferences, notify } = useApp(),
    client = useQueryClient()
  const [theme, setTheme] = useState(preferences.theme),
    [accent, setAccent] = useState(preferences.accent),
    [error, setError] = useState(''),
    [resetOpen, setResetOpen] = useState(false)
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    try {
      savePreferences({
        theme,
        accent,
        businesses: {
          ...preferences.businesses,
          [business.id]: {
            name: String(data.get('name')).trim(),
            goalCents: Math.round(Number(data.get('goal')) * 100),
          },
        },
      })
      setError('')
    } catch {
      setError('No se pudo guardar. Verifica los valores y el almacenamiento del navegador.')
    }
  }
  async function reset() {
    try {
      const { resetDemo } = await import('../../data/demo')
      resetDemo()
      await client.invalidateQueries()
      setResetOpen(false)
      notify('Los tres negocios de demostración se restauraron.')
    } catch {
      setError('No se pudieron restaurar los datos locales.')
      setResetOpen(false)
    }
  }
  return (
    <div className="page-content settings-grid">
      <form onSubmit={submit} className="card settings-form">
        <div className="card-heading">
          <div>
            <h2>Hazlo tuyo</h2>
            <p>Una base que se adapta a la identidad de cada negocio.</p>
          </div>
          <Palette size={20} className="text-muted" />
        </div>
        <div className="settings-body">
          <h3>Perfil del negocio</h3>
          <label>
            Nombre visible
            <input name="name" defaultValue={business.name} minLength={2} maxLength={40} required />
          </label>
          <label>
            Meta de ingresos para 30 días (MXN)
            <input
              name="goal"
              type="number"
              min="1"
              max="100000000"
              step="0.01"
              defaultValue={business.goalCents / 100}
              required
            />
          </label>
          <p className="field-help">
            Para 7 o 90 días, la meta se ajusta proporcionalmente. Es una referencia configurable.
          </p>
          <hr />
          <h3>Apariencia</h3>
          <fieldset>
            <legend>Tema de la interfaz</legend>
            <div className="theme-options">
              {(
                [
                  { id: 'light', label: 'Claro', icon: Sun },
                  { id: 'dark', label: 'Oscuro', icon: Moon },
                  { id: 'system', label: 'Sistema', icon: Palette },
                ] as const
              ).map((t) => (
                <label key={t.id} className={theme === t.id ? 'selected' : ''}>
                  <input
                    type="radio"
                    name="theme"
                    value={t.id}
                    checked={theme === t.id}
                    onChange={() => setTheme(t.id)}
                  />
                  <t.icon size={20} />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Color principal</legend>
            <div className="accent-options">
              {(
                [
                  { id: 'green', label: 'Bosque', color: '#23796a' },
                  { id: 'blue', label: 'Océano', color: '#2867af' },
                  { id: 'violet', label: 'Violeta', color: '#7757af' },
                ] as const
              ).map((a) => (
                <label key={a.id} className={accent === a.id ? 'selected' : ''}>
                  <input
                    type="radio"
                    name="accent"
                    value={a.id}
                    checked={accent === a.id}
                    onChange={() => setAccent(a.id as Preferences['accent'])}
                  />
                  <span style={{ background: a.color }}>
                    {accent === a.id && <Check size={14} />}
                  </span>
                  {a.label}
                </label>
              ))}
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button className="button primary" type="submit">
            <CheckCheck size={17} />
            Guardar preferencias
          </button>
        </div>
      </form>
      <div className="settings-aside">
        <section className="card">
          <span className="report-icon">
            <Database size={23} />
          </span>
          <h2>Tu espacio de prueba</h2>
          <p>
            {isDemo
              ? 'Los datos son ficticios. Las ventas que agregues y los cambios de estado se guardan solo en este navegador.'
              : 'La aplicación está configurada para consultar una API externa.'}
          </p>
          <div className="connection-label">
            <i />
            {isDemo ? 'Datos de demostración' : 'Proveedor API'}
          </div>
          {isDemo && (
            <button className="button danger" onClick={() => setResetOpen(true)}>
              Restaurar datos de ejemplo
            </button>
          )}
        </section>
        <section className="card">
          <span className="report-icon">
            <ShieldCheck size={23} />
          </span>
          <h2>Lista para el siguiente paso</h2>
          <p>
            Para usar datos reales, conecta el proveedor de datos a una API con autenticación y
            permisos por negocio.
          </p>
          <a
            className="text-link"
            href="https://github.com/Ozzy-Barbosa/dashboard-base/blob/main/docs/GUIA-DE-ESTUDIO.md"
            target="_blank"
            rel="noreferrer"
          >
            Consultar guía de implementación ↗
          </a>
        </section>
      </div>
      {resetOpen && (
        <Dialog title="Restaurar datos de ejemplo" onClose={() => setResetOpen(false)}>
          <p className="dialog-copy">
            Se eliminarán las ventas que agregaste y los cambios de estado de los tres negocios de
            demostración en este navegador. Tus preferencias de apariencia se conservarán.
          </p>
          <div className="dialog-actions">
            <button className="button" onClick={() => setResetOpen(false)}>
              Conservar cambios
            </button>
            <button className="button danger" onClick={() => void reset()}>
              Restaurar los tres negocios
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
