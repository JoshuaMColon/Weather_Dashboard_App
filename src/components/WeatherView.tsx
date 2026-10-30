import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useWeather } from '../hooks/useWeather'
import { notableChanges } from '../lib/insights'
import { precipIntensity, skyGradient, skyState } from '../lib/sky'
import { skyStore } from '../lib/skyStore'
import { codeInfo } from '../lib/weatherCodes'
import { fmtTemp, type Preferences } from '../lib/units'
import { DailyCard } from './DailyCard'
import { Hero } from './Hero'
import { HourlyCard } from './HourlyCard'
import { Notables } from './Notables'
import { Tiles } from './Tiles'

const FALLBACK_SKY = { kind: 'cloudy', period: 'night', key: 'cloudy-night' } as const

export function WeatherView({ name, lat, lon, isHere, prefs }: { name: string; lat: number; lon: number; isHere: boolean; prefs: Preferences }) {
  const { data, error, loading, refresh } = useWeather(lat, lon)
  const sky = data ? skyState(data) : FALLBACK_SKY
  const gradient = skyGradient(sky, prefs.theme)
  const notables = useMemo(() => (data ? notableChanges(data, prefs) : []), [data, prefs])
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 230)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Publish the scene to the app-level sky so it can crossfade between cities.
  const code = data?.current.code
  const windKph = data?.current.windKph ?? 0
  const windDirDeg = data?.current.windDirDeg ?? 270
  useEffect(() => {
    skyStore.set(
      { sky, gradient, intensity: code === undefined ? 0 : precipIntensity(code), windKph: Math.round(windKph), windDirDeg: Math.round(windDirDeg) },
      { onlyIfEmpty: code === undefined },
    )
  }, [sky, gradient, code, windKph, windDirDeg])

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', gradient.match(/#[0-9a-f]{6}/i)?.[0] ?? '#1d5fae')
  }, [gradient])

  return (
    <>
      {data && (
        <div
          className={`glass-bar text-shadow fixed inset-x-0 top-0 z-10 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 text-center transition-opacity duration-200 lg:left-[340px] ${scrolled ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          aria-hidden="true"
        >
          <p className="text-[17px] font-semibold">{name}</p>
          <p className="text-[14px]">
            {fmtTemp(data.current.tempC, prefs.units)} | {codeInfo(data.current.code).label}
          </p>
        </div>
      )}
      <div className="mx-auto w-full max-w-[880px] px-4 pb-28 lg:px-8 lg:pb-12" data-sky={sky.key}>
        {data ? (
          <>
            <Hero name={name} isHere={isHere} w={data} prefs={prefs} />
            <div className="space-y-3 sm:space-y-4">
              <Notables items={notables} />
              <HourlyCard w={data} prefs={prefs} />
              <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                <div className="lg:sticky lg:top-4 lg:self-start">
                  <DailyCard w={data} prefs={prefs} />
                </div>
                <Tiles w={data} prefs={prefs} />
              </div>
            </div>
            <footer className="glass mx-auto mt-8 w-fit max-w-full rounded-full px-4 py-2 text-center text-[13px]">
              Weather data by{' '}
              <a href="https://open-meteo.com/" className="underline underline-offset-2" target="_blank" rel="noreferrer">
                Open-Meteo
              </a>{' '}
              (CC BY 4.0) · Updated {new Date(data.fetchedAt * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </footer>
          </>
        ) : (
          <div className="text-shadow flex min-h-[70vh] flex-col items-center justify-center gap-3 text-center" role="status">
            <h1 className="text-[34px]">{name}</h1>
            {error && !loading ? (
              <>
                <p className="flex items-center gap-2 text-[17px]">
                  <AlertCircle size={18} aria-hidden="true" /> Couldn't load the weather.
                </p>
                <button type="button" onClick={refresh} className="press glass flex items-center gap-2 rounded-full px-4 py-2 font-semibold">
                  <RefreshCw size={16} aria-hidden="true" /> Try again
                </button>
              </>
            ) : (
              <>
                <div className="skeleton h-24 w-40 rounded-3xl" />
                <span className="sr-only">Loading weather</span>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
