import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react'
import { useAuth } from './hooks/useAuth'
import { useGeolocation } from './hooks/useGeolocation'
import { usePlaces } from './hooks/usePlaces'
import { usePreferences } from './hooks/usePreferences'
import type { GeocodeResult } from './lib/api'
import { round4, SAMPLE_PLACES, samePlace, type Place } from './lib/places'
import { load, save } from './lib/storage'
import { AccountSheet } from './components/AccountSheet'
import { CityList } from './components/CityList'
import { Toolbar } from './components/Toolbar'
import { WeatherView } from './components/WeatherView'
import { Sky } from './components/Sky'

const keyOf = (p: Pick<Place, 'lat' | 'lon' | 'id'>) => (p.id === 'here' ? 'here' : `${round4(p.lat)},${round4(p.lon)}`)
const BASE = import.meta.env.BASE_URL

export default function App() {
  const auth = useAuth()
  const { prefs, update } = usePreferences(auth.user)
  const { places, sync, add, remove, move } = usePlaces(auth.user)
  const geo = useGeolocation()
  const all = useMemo(() => (geo.here ? [geo.here, ...places] : places), [geo.here, places])

  const [selected, setSelected] = useState<string | null>(() => load<string | null>('wx:selected', null))
  const found = all.findIndex((p) => keyOf(p) === selected)
  const index = found >= 0 ? found : 0
  const current = all[index] ?? null
  const [preview, setPreview] = useState<GeocodeResult | null>(null)
  const [listOpen, setListOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const select = useCallback((key: string) => {
    setSelected(key)
    save('wx:selected', key)
    setPreview(null)
    setListOpen(false)
    window.scrollTo({ top: 0 })
  }, [])

  const go = useCallback(
    (dir: -1 | 1) => {
      const next = all[index + dir]
      if (next) select(keyOf(next))
    },
    [all, index, select],
  )

  // /demo: start a guest session (or a local sample set) so visitors see sync immediately.
  const demoStarted = useRef(false)
  useEffect(() => {
    if (demoStarted.current || !auth.ready) return
    if (!window.location.pathname.replace(/\/+$/, '').endsWith('/demo')) return
    demoStarted.current = true
    sessionStorage.setItem('wx:demo', '1')
    window.history.replaceState(null, '', BASE)
    const run = async () => {
      if (auth.enabled && !auth.user) {
        const err = await auth.startGuest()
        setToast(err ? `Couldn't start a guest session: ${err}` : 'You are signed in as a guest. Sample cities were added and sync live.')
      } else {
        for (const s of SAMPLE_PLACES) await add(s)
        setToast(auth.user ? 'Sample cities added to your list.' : 'Sample cities added on this device.')
      }
    }
    void run()
  }, [auth, add])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 6000)
    return () => window.clearTimeout(t)
  }, [toast])

  // Arrow keys move between cities when focus isn't in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && listOpen) return setListOpen(false)
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, [role="listbox"], dialog') || preview) return
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, preview, listOpen])

  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]
    touch.current = (e.target as HTMLElement).closest('[data-testid="hourly"]') ? null : { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: TouchEvent) => {
    const s = touch.current
    touch.current = null
    if (!s || preview) return
    const t = e.changedTouches[0]
    const dx = t.clientX - s.x
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(t.clientY - s.y) * 1.5) go(dx < 0 ? 1 : -1)
  }

  const onPick = (r: GeocodeResult) => {
    const existing = places.find((p) => samePlace(p, r))
    if (existing) return select(keyOf(existing))
    setPreview(r)
    setListOpen(false)
    window.scrollTo({ top: 0 })
  }

  const onLocate = () => {
    geo.locate()
    select('here')
  }

  const addPreview = async () => {
    if (!preview) return
    const { name, lat, lon, country, admin1 } = preview
    await add({ name, lat, lon, country, admin1 })
    select(`${round4(lat)},${round4(lon)}`)
  }

  const accountLabel = !auth.enabled ? 'On this device' : auth.user ? (auth.isGuest ? 'Guest' : (auth.user.email ?? 'Account')) : 'Sign in to sync'
  const renderList = (onClose?: () => void) => (
    <CityList
      onClose={onClose}
      here={geo.here}
      places={places}
      selectedId={preview ? null : current?.id ?? null}
      prefs={prefs}
      sync={sync}
      accountLabel={accountLabel}
      onSelect={(id) => {
        const p = all.find((x) => x.id === id)
        if (p) select(keyOf(p))
      }}
      onPick={onPick}
      onRemove={remove}
      onMove={move}
      onLocate={onLocate}
      locating={geo.status === 'locating'}
      locateStatus={geo.status}
      onAccount={() => setAccountOpen(true)}
    />
  )

  return (
    <div className="min-h-dvh text-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-black focus:px-3 focus:py-2">
        Skip to forecast
      </a>

      {/* Desktop sidebar */}
      <aside className="sidebar fixed inset-y-0 left-0 z-20 hidden w-[340px] pt-2 lg:block">{renderList()}</aside>

      {/* Mobile list overlay */}
      {listOpen && (
        <div className="list-overlay fixed inset-0 z-30 bg-black pt-[env(safe-area-inset-top)] lg:hidden" role="dialog" aria-modal="true" aria-label="Cities">
          {renderList(() => setListOpen(false))}
        </div>
      )}

      <main id="main" className="relative min-h-dvh lg:pl-[340px]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} aria-live="polite">
        <Sky />
        {preview ? (
          <>
            <div className="glass-bar fixed inset-x-0 top-0 z-20 flex justify-between px-4 pt-[max(0.6rem,env(safe-area-inset-top))] pb-2 lg:left-[340px]" data-testid="preview-bar">
              <button type="button" className="press rounded-full px-2 py-1 text-[17px]" onClick={() => setPreview(null)}>
                Cancel
              </button>
              <button type="button" className="press rounded-full px-2 py-1 text-[17px] font-semibold" onClick={addPreview} data-testid="add-city">
                Add
              </button>
            </div>
            <WeatherView key={`p-${preview.id}`} name={preview.name} lat={preview.lat} lon={preview.lon} isHere={false} prefs={prefs} />
          </>
        ) : current ? (
          <WeatherView key={keyOf(current)} name={current.name} lat={current.lat} lon={current.lon} isHere={current.id === 'here'} prefs={prefs} />
        ) : (
          <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#1d5fae] to-[#2f74c4] px-6 text-center">
            <h1 className="text-[34px] font-semibold">Weather</h1>
            <p className="max-w-sm text-white/90">Search for a city or use your location to get started.</p>
            <button type="button" className="press glass rounded-full px-5 py-2.5 font-semibold lg:hidden" onClick={() => setListOpen(true)}>
              Find a city
            </button>
          </div>
        )}
      </main>

      {!preview && <Toolbar count={all.length} index={index} hasHere={!!geo.here} onDot={(i) => all[i] && select(keyOf(all[i]))} onList={() => setListOpen(true)} onAccount={() => setAccountOpen(true)} />}

      <AccountSheet open={accountOpen} onClose={() => setAccountOpen(false)} auth={auth} prefs={prefs} onPrefs={update} />

      {toast && (
        <div role="status" className="toast fixed inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-40 mx-auto max-w-md rounded-2xl bg-[#1c1f26]/95 px-4 py-3 text-[15px] shadow-2xl backdrop-blur" data-testid="toast">
          {toast}
        </div>
      )}
    </div>
  )
}
