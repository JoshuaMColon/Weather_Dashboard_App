import { useRef, type ReactNode } from 'react'
import { Droplets, Eye, Gauge, Leaf, MoonStar, Sun, Sunset, Thermometer, Umbrella, Wind } from 'lucide-react'
import type { WeatherResponse } from '../lib/api'
import { moonPhase } from '../lib/moon'
import { fmtClock, fmtHour, nowUnix } from '../lib/time'
import { compass, fmtDistance, fmtPrecip, fmtPressure, fmtTemp, fmtWind, type Preferences } from '../lib/units'
import { Card } from './Card'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useInViewOnce } from '../hooks/useInViewOnce'
import { easeOutBack, useTween } from '../hooks/useTween'

function Tile({ icon, title, children, testId }: { icon: ReactNode; title: string; children: ReactNode; testId: string }) {
  return (
    <Card icon={icon} title={title} className="flex aspect-square flex-col !p-3.5 sm:!p-4">
      <div className="flex min-h-0 flex-1 flex-col pt-1.5" data-testid={`tile-${testId}`}>
        {children}
      </div>
    </Card>
  )
}

const Big = ({ children }: { children: ReactNode }) => <p className="text-[32px] leading-tight font-medium">{children}</p>
const Sub = ({ children }: { children: ReactNode }) => <p className="text-[18px] leading-tight font-semibold">{children}</p>
const Foot = ({ children }: { children: ReactNode }) => <p className="mt-auto text-[13px] leading-snug text-white/90">{children}</p>

function Scale({ value, gradient, label }: { value: number; gradient: string; label: string }) {
  return (
    <div className="relative my-2 h-[5px] rounded-full" style={{ background: gradient }} role="img" aria-label={label}>
      <span className="absolute top-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black/40 bg-white" style={{ left: `${Math.min(100, Math.max(0, value * 100))}%` }} />
    </div>
  )
}

const uvLabel = (uv: number) => (uv < 3 ? 'Low' : uv < 6 ? 'Moderate' : uv < 8 ? 'High' : uv < 11 ? 'Very High' : 'Extreme')
const aqiLabel = (a: number) => (a <= 50 ? 'Good' : a <= 100 ? 'Moderate' : a <= 150 ? 'Unhealthy for Sensitive Groups' : a <= 200 ? 'Unhealthy' : a <= 300 ? 'Very Unhealthy' : 'Hazardous')

export function Tiles({ w, prefs }: { w: WeatherResponse; prefs: Preferences }) {
  const c = w.current
  const off = w.location.utcOffsetSeconds
  const u = prefs.units
  const today = w.daily[0]
  const tomorrow = w.daily[1]

  // UV: "Use sun protection until 4PM" from the hourly UV curve.
  const uvHigh = w.hourly.slice(0, 18).filter((h) => h.uvIndex >= 3)
  const uvFoot = uvHigh.length
    ? `Use sun protection${c.uvIndex >= 3 ? '' : ` from ${fmtHour(uvHigh[0].time, off)}`} until ${fmtHour(uvHigh[uvHigh.length - 1].time + 3600, off)}.`
    : `${uvLabel(Math.max(...w.hourly.slice(0, 18).map((h) => h.uvIndex), 0))} for the rest of the day.`

  const diff = c.feelsLikeC - c.tempC
  const feelsFoot = Math.abs(diff) < 1.5 ? 'Similar to the actual temperature.' : diff < 0 ? (c.windKph > 15 ? 'Wind is making it feel colder.' : 'It feels colder than the actual temperature.') : c.humidity > 60 ? 'Humidity is making it feel warmer.' : 'It feels warmer than the actual temperature.'

  const wind = fmtWind(c.windKph, prefs.windUnit)
  const gust = fmtWind(c.gustKph, prefs.windUnit)

  const vis = c.visibilityM
  const visFoot = vis >= 16000 ? 'Perfectly clear view.' : vis >= 8000 ? 'Clear view.' : vis >= 3000 ? 'Haze is reducing visibility.' : 'Fog or precipitation is limiting visibility.'

  const press = fmtPressure(c.pressureHpa, u)
  const pressFrac = (c.pressureHpa - 970) / (1050 - 970)

  // Sunrise/sunset arc: where the sun is between today's sunrise and sunset.
  const now = nowUnix()
  const nextIsSunset = today && now >= today.sunrise && now < today.sunset
  const nextEvent = nextIsSunset ? { label: 'Sunset', t: today!.sunset } : now < (today?.sunrise ?? 0) ? { label: 'Sunrise', t: today!.sunrise } : { label: 'Sunrise', t: tomorrow?.sunrise ?? 0 }
  const otherEvent = nextIsSunset ? { label: 'Sunrise', t: today!.sunrise } : { label: 'Sunset', t: today?.sunset ?? 0 }
  const dayFrac = today ? Math.min(1, Math.max(0, (now - today.sunrise) / (today.sunset - today.sunrise))) : 0

  const moon = moonPhase(now)
  const reduced = useReducedMotion()
  const aq = w.airQuality

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4" data-testid="tiles">
      <Tile icon={<Sun size={13} aria-hidden="true" />} title="UV index" testId="uv">
        <Big>{Math.round(c.uvIndex)}</Big>
        <Sub>{uvLabel(c.uvIndex)}</Sub>
        <Scale value={c.uvIndex / 11} gradient="linear-gradient(90deg,#3fd16b,#f5d93c,#ff9f2e,#ff4f4f,#b56cff)" label={`UV ${Math.round(c.uvIndex)} of 11+`} />
        <Foot>{uvFoot}</Foot>
      </Tile>

      <Tile icon={<Thermometer size={13} aria-hidden="true" />} title="Feels like" testId="feels">
        <Big>{fmtTemp(c.feelsLikeC, u)}</Big>
        <Foot>{feelsFoot}</Foot>
      </Tile>

      <Tile icon={<Wind size={13} aria-hidden="true" />} title="Wind" testId="wind">
        <div className="flex flex-1 items-center justify-center">
          <div className="relative aspect-square h-full max-h-[120px]" role="img" aria-label={`Wind ${wind.value} ${wind.unit} from the ${compass(c.windDirDeg)}, gusts ${gust.value} ${gust.unit}`}>
            <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="6" strokeDasharray="1 3.6" />
              {(['N', 'E', 'S', 'W'] as const).map((d, i) => (
                <text key={d} x={50 + 34 * Math.sin((i * Math.PI) / 2)} y={54 - 34 * Math.cos((i * Math.PI) / 2)} textAnchor="middle" fontSize="11" fontWeight="700" fill="white">
                  {d}
                </text>
              ))}
            </svg>
            <Needle deg={c.windDirDeg + 180} reduced={reduced} />
            <div className="absolute inset-[28%] flex flex-col items-center justify-center rounded-full bg-[#0c1a33]/70 leading-none">
              <span className="text-[20px] font-semibold">{wind.value}</span>
              <span className="text-[11px] font-semibold">{wind.unit}</span>
            </div>
          </div>
        </div>
        <Foot>
          {compass(c.windDirDeg)} · Gusts {gust.value} {gust.unit}
        </Foot>
      </Tile>

      <Tile icon={<Droplets size={13} aria-hidden="true" />} title="Humidity" testId="humidity">
        <Big>{Math.round(c.humidity)}%</Big>
        <Foot>The dew point is {fmtTemp(c.dewPointC, u)} right now.</Foot>
      </Tile>

      <Tile icon={<Eye size={13} aria-hidden="true" />} title="Visibility" testId="visibility">
        <Big>{fmtDistance(vis, u)}</Big>
        <Foot>{visFoot}</Foot>
      </Tile>

      <Tile icon={<Gauge size={13} aria-hidden="true" />} title="Pressure" testId="pressure">
        <div className="flex flex-1 items-center justify-center">
          <svg viewBox="0 0 100 80" className="h-full max-h-[110px] w-full" role="img" aria-label={`Pressure ${press.value} ${press.unit}, ${c.pressureTrend > 0.5 ? 'rising' : c.pressureTrend < -0.5 ? 'falling' : 'steady'}`}>
            <path d="M15 70 A40 40 0 1 1 85 70" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="7" strokeDasharray="1 3" />
            <PressureFill frac={Math.max(0.02, Math.min(1, pressFrac))} reduced={reduced} />
            <text x="50" y="50" textAnchor="middle" fontSize="16" fontWeight="600" fill="white">
              {c.pressureTrend > 0.5 ? '↑' : c.pressureTrend < -0.5 ? '↓' : '='} {press.value}
            </text>
            <text x="50" y="64" textAnchor="middle" fontSize="10" fontWeight="600" fill="white">
              {press.unit}
            </text>
          </svg>
        </div>
      </Tile>

      <Tile icon={<Umbrella size={13} aria-hidden="true" />} title="Precipitation" testId="precip">
        <Big>{fmtPrecip(w.precipLast24hMm, u)}</Big>
        <Sub>In last 24h</Sub>
        <Foot>{w.precipNext24hMm > 0 ? `${fmtPrecip(w.precipNext24hMm, u)} expected in next 24h.` : 'None expected in next 24h.'}</Foot>
      </Tile>

      <Tile icon={<Sunset size={13} aria-hidden="true" />} title={nextEvent.label} testId="sun">
        <Big>{fmtClock(nextEvent.t, off)}</Big>
        <svg viewBox="0 0 100 40" className="my-1 w-full" role="img" aria-label={`Sun is ${Math.round(dayFrac * 100)}% through the day`}>
          <path d="M2 34 Q50 -18 98 34" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2" />
          <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(255,255,255,.5)" strokeWidth="1" />
          <SunProgress frac={dayFrac} reduced={reduced} />
        </svg>
        <Foot>
          {otherEvent.label}: {fmtClock(otherEvent.t, off)}
        </Foot>
      </Tile>

      <Tile icon={<Leaf size={13} aria-hidden="true" />} title="Air quality" testId="aqi">
        {aq ? (
          <>
            <Big>{aq.usAqi}</Big>
            <Sub>{aqiLabel(aq.usAqi)}</Sub>
            <Scale value={aq.usAqi / 300} gradient="linear-gradient(90deg,#3fd16b,#f5d93c,#ff9f2e,#ff4f4f,#b56cff,#8a1c3a)" label={`US AQI ${aq.usAqi}`} />
            <Foot>{aq.pm25 !== null ? `PM2.5 is ${Math.round(aq.pm25)} µg/m³.` : 'US AQI from Open-Meteo.'}</Foot>
          </>
        ) : (
          <Foot>Air quality data isn't available here.</Foot>
        )}
      </Tile>

      <Tile icon={<MoonStar size={13} aria-hidden="true" />} title="Moon" testId="moon">
        <div className="flex items-center gap-3">
          <MoonGlyph phase={moon.phase} />
          <div>
            <Sub>{moon.name}</Sub>
            <p className="text-[13px] text-white/90">{moon.illumination}% lit</p>
          </div>
        </div>
        <Foot>{moon.daysToFull === 0 ? 'Full moon tonight.' : `Next full moon in ${moon.daysToFull} day${moon.daysToFull === 1 ? '' : 's'}.`}</Foot>
      </Tile>
    </div>
  )
}

/** Draws the lit part of the moon for a phase in [0, 1). */
function MoonGlyph({ phase }: { phase: number }) {
  const r = 22
  const waxing = phase < 0.5
  const k = Math.cos(2 * Math.PI * phase) // 1 new → -1 full
  const rx = Math.abs(k) * r
  const sweepOuter = waxing ? 1 : 0
  const sweepInner = k > 0 ? (waxing ? 0 : 1) : waxing ? 1 : 0
  const d = `M24 2 A${r} ${r} 0 0 ${sweepOuter} 24 46 A${rx} ${r} 0 0 ${sweepInner} 24 2 Z`
  return (
    <svg viewBox="0 0 48 48" className="h-14 w-14 shrink-0" aria-hidden="true">
      <circle cx="24" cy="24" r={r} fill="rgba(255,255,255,.18)" />
      <path d={d} fill="#f4f1e6" />
    </svg>
  )
}

/** Wind arrow: swings in from off-axis and settles with a slight overshoot, then breathes gently. */
function Needle({ deg, reduced }: { deg: number; reduced: boolean }) {
  const ref = useRef<SVGSVGElement>(null)
  const seen = useInViewOnce(ref)
  const angle = useTween(deg, { from: deg - 140, duration: 1500, enabled: !reduced, active: seen, ease: easeOutBack })
  return (
    <svg ref={ref} viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" data-testid="wind-needle" data-angle={Math.round(angle)}>
      {/* Arrow points where the wind is blowing to (meteorological direction + 180°). */}
      <g transform={`rotate(${angle} 50 50)`}>
        <g className="needle-wobble">
          <line x1="50" y1="88" x2="50" y2="16" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <path d="M50 8 L57 20 L43 20 Z" fill="white" />
          <circle cx="50" cy="88" r="4" fill="none" stroke="white" strokeWidth="2.5" />
        </g>
      </g>
    </svg>
  )
}

function PressureFill({ frac, reduced }: { frac: number; reduced: boolean }) {
  const ref = useRef<SVGPathElement>(null)
  const seen = useInViewOnce(ref)
  const f = useTween(frac, { from: 0.02, duration: 1100, enabled: !reduced, active: seen })
  return <path ref={ref} d="M15 70 A40 40 0 1 1 85 70" fill="none" stroke="white" strokeWidth="7" strokeDasharray={`${f * 188} 400`} pathLength="188" strokeLinecap="round" opacity=".95" />
}

/** Sun travels along the arc to its current position, lighting the part of the day already passed. */
function SunProgress({ frac, reduced }: { frac: number; reduced: boolean }) {
  const ref = useRef<SVGGElement>(null)
  const seen = useInViewOnce(ref)
  const t = useTween(frac, { from: 0, duration: 1400, enabled: !reduced, active: seen })
  // Quadratic Bezier P0(2,34) P1(50,-18) P2(98,34), split at t (de Casteljau).
  const x = (1 - t) * (1 - t) * 2 + 2 * (1 - t) * t * 50 + t * t * 98
  const y = (1 - t) * (1 - t) * 34 + 2 * (1 - t) * t * -18 + t * t * 34
  const cx = 2 + t * 48
  const cy = 34 - t * 52
  return (
    <g ref={ref} data-testid="sun-progress" data-t={t.toFixed(3)}>
      {t > 0.001 && <path d={`M2 34 Q${cx} ${cy} ${x} ${y}`} fill="none" stroke="#ffe38a" strokeWidth="2.6" strokeLinecap="round" />}
      <circle cx={x} cy={y} r="7" fill="#ffd84a" opacity=".28" />
      <circle cx={x} cy={y} r="4.5" fill="#fff" stroke="#ffd84a" strokeWidth="2" />
    </g>
  )
}
