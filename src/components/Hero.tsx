import { Navigation } from 'lucide-react'
import type { WeatherResponse } from '../lib/api'
import { codeInfo } from '../lib/weatherCodes'
import { fmtTemp, toTemp, type Preferences } from '../lib/units'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useTween } from '../hooks/useTween'

export function Hero({ name, isHere, w, prefs }: { name: string; isHere: boolean; w: WeatherResponse; prefs: Preferences }) {
  const today = w.daily[0]
  const label = codeInfo(w.current.code).label
  const reduced = useReducedMotion()
  const deg = Math.round(toTemp(w.current.tempC, prefs.units))
  // Count up over the last few degrees on load: lively without a long-running number.
  const shown = Math.round(useTween(deg, { from: deg - Math.sign(deg || 1) * Math.min(Math.abs(deg), 14), duration: 800, enabled: !reduced }))
  return (
    <header className="text-shadow pt-12 pb-8 text-center md:pt-16" data-testid="hero">
      {isHere && (
        <p className="flex items-center justify-center gap-1 text-[13px] font-semibold uppercase tracking-wide">
          <Navigation size={12} className="fill-white" aria-hidden="true" /> My Location
        </p>
      )}
      <h1 className="text-[34px] leading-tight font-normal tracking-tight" data-testid="city-name">
        {name}
      </h1>
      <p className="temp-hero leading-none" aria-label={`${deg} degrees ${prefs.units === 'F' ? 'Fahrenheit' : 'Celsius'}`} data-testid="current-temp">
        <span className="pl-[0.28em] tabular-nums">{shown}°</span>
      </p>
      <p className="text-[20px] font-medium">{label}</p>
      {today && (
        <p className="text-[20px] font-medium">
          H:{fmtTemp(today.maxC, prefs.units)}&nbsp;&nbsp;L:{fmtTemp(today.minC, prefs.units)}
        </p>
      )}
    </header>
  )
}
