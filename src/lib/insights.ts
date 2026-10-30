import type { WeatherResponse } from '../../api/_lib/openMeteo'
import { codeInfo, isWet } from './weatherCodes'
import { fmtHour } from './time'
import { fmtWind, toTemp, type Preferences } from './units'

export interface Notable {
  level: 'info' | 'watch' | 'warning'
  title: string
  detail: string
}

/**
 * "Notable change" banners computed from the forecast itself (these are not
 * official government alerts): precipitation starting soon, storms, strong gusts,
 * extreme heat or cold.
 */
export function notableChanges(w: WeatherResponse, prefs: Preferences): Notable[] {
  const off = w.location.utcOffsetSeconds
  const out: Notable[] = []
  const next = w.hourly.slice(1, 13)
  const wetNow = isWet(w.current.code) || w.current.precipitationMm > 0.1

  const storm = w.hourly.slice(0, 12).find((h) => codeInfo(h.code).kind === 'storm')
  if (storm) {
    out.push({ level: 'warning', title: 'Thunderstorms possible', detail: `Storms are in the forecast around ${fmtHour(storm.time, off)}. Stay indoors when thunder roars.` })
  }

  if (!wetNow) {
    const start = w.hourly.slice(1, 4).find((h) => h.precipProb >= 55 && isWet(h.code))
    if (start) {
      const snow = codeInfo(start.code).kind === 'snow'
      out.push({ level: 'watch', title: `${snow ? 'Snow' : 'Rain'} starting soon`, detail: `${snow ? 'Snow' : 'Rain'} likely around ${fmtHour(start.time, off)} (${start.precipProb}% chance).` })
    }
  } else {
    const stop = next.find((h) => !isWet(h.code) && h.precipProb < 30)
    if (stop) out.push({ level: 'info', title: 'Drying out', detail: `Precipitation should ease around ${fmtHour(stop.time, off)}.` })
  }

  const gust = w.current.gustKph
  if (gust >= 64) {
    const g = fmtWind(gust, prefs.windUnit)
    out.push({ level: 'warning', title: 'Strong wind gusts', detail: `Gusts up to ${g.value} ${g.unit}. Secure loose outdoor items.` })
  }
  const aqi = w.airQuality?.usAqi
  if (aqi !== undefined && aqi > 150) {
    out.push({ level: 'warning', title: 'Unhealthy air quality', detail: `The US AQI is ${aqi}. Consider limiting time outdoors.` })
  } else if (aqi !== undefined && aqi > 100) {
    out.push({ level: 'watch', title: 'Air quality alert', detail: `The US AQI is ${aqi}, which is unhealthy for sensitive groups.` })
  }
  if (w.current.feelsLikeC >= 38) {
    out.push({ level: 'warning', title: 'Extreme heat', detail: `It feels like ${Math.round(toTemp(w.current.feelsLikeC, prefs.units))}°. Limit time outdoors and stay hydrated.` })
  } else if (w.current.feelsLikeC <= -18) {
    out.push({ level: 'warning', title: 'Dangerous cold', detail: `It feels like ${Math.round(toTemp(w.current.feelsLikeC, prefs.units))}°. Frostbite is possible on exposed skin.` })
  }
  return out
}

/** The one-line summary that sits at the top of the hourly card, like iOS. */
export function hourlySummary(w: WeatherResponse, prefs: Preferences): string {
  const off = w.location.utcOffsetSeconds
  const nowKind = codeInfo(w.current.code).kind
  const window = w.hourly.slice(1, 13)
  const change = window.find((h) => codeInfo(h.code).kind !== nowKind)
  const gust = fmtWind(Math.max(w.current.gustKph, w.daily[0]?.windMaxKph ?? 0), prefs.windUnit)
  const label = codeInfo(w.current.code).label.toLowerCase()
  const first = change
    ? `${codeInfo(change.code).label} expected around ${fmtHour(change.time, off)}.`
    : `${label[0].toUpperCase()}${label.slice(1)}${/s$/.test(label) ? '' : ' conditions'} will continue for the next several hours.`
  return gust.value >= 15 ? `${first} Wind gusts are up to ${gust.value} ${gust.unit}.` : first
}
