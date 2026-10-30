import type { WeatherResponse } from '../../api/_lib/openMeteo'
import { codeInfo, type SkyKind } from './weatherCodes'
import { nowUnix } from './time'

export type Period = 'day' | 'night' | 'twilight'
export interface SkyState {
  kind: SkyKind
  period: Period
  key: string
}

/** Day/night/twilight from the location's own sunrise and sunset, not the viewer's clock. */
export function skyState(w: WeatherResponse, at = nowUnix()): SkyState {
  const kind = codeInfo(w.current.code).kind
  const today = w.daily.find((d) => at >= d.time && at < d.time + 86400) ?? w.daily[0]
  let period: Period = w.current.isDay ? 'day' : 'night'
  if (today) {
    const nearSunrise = Math.abs(at - today.sunrise) < 40 * 60
    const nearSunset = Math.abs(at - today.sunset) < 40 * 60
    if (nearSunrise || nearSunset) period = 'twilight'
    else period = at > today.sunrise && at < today.sunset ? 'day' : 'night'
  }
  return { kind, period, key: `${kind}-${period}` }
}

/**
 * iOS-Weather-like gradients. Each is kept deep enough that white text and the
 * frosted cards on top of it meet WCAG AA contrast.
 */
const GRADIENTS: Record<string, string> = {
  'clear-day': 'linear-gradient(180deg, #1d5fae 0%, #2f74c4 45%, #4787cc 100%)',
  'partly-day': 'linear-gradient(180deg, #2a5f99 0%, #4378b3 50%, #5b85b6 100%)',
  'cloudy-day': 'linear-gradient(180deg, #4a5d73 0%, #5f7288 50%, #75879b 100%)',
  'fog-day': 'linear-gradient(180deg, #4f5a67 0%, #626d7a 50%, #77818c 100%)',
  'drizzle-day': 'linear-gradient(180deg, #3b4b5e 0%, #4c5d70 55%, #607184 100%)',
  'rain-day': 'linear-gradient(180deg, #2f3e51 0%, #405064 55%, #536376 100%)',
  'snow-day': 'linear-gradient(180deg, #44607f 0%, #58718f 55%, #6c84a0 100%)',
  'storm-day': 'linear-gradient(180deg, #1f2533 0%, #2e3646 55%, #3e4757 100%)',
  'clear-night': 'linear-gradient(180deg, #050a1d 0%, #0d1838 50%, #1b2a55 100%)',
  'partly-night': 'linear-gradient(180deg, #0a1124 0%, #18223f 55%, #283452 100%)',
  'cloudy-night': 'linear-gradient(180deg, #151a26 0%, #222a38 55%, #313a4a 100%)',
  'fog-night': 'linear-gradient(180deg, #1b2029 0%, #2a303a 55%, #3a414c 100%)',
  'drizzle-night': 'linear-gradient(180deg, #10151f 0%, #1c2330 55%, #2a3241 100%)',
  'rain-night': 'linear-gradient(180deg, #0c1119 0%, #171e2a 55%, #252d3b 100%)',
  'snow-night': 'linear-gradient(180deg, #1a2436 0%, #2b3850 55%, #3e4c66 100%)',
  'storm-night': 'linear-gradient(180deg, #07090f 0%, #121621 55%, #1e2330 100%)',
  'clear-twilight': 'linear-gradient(180deg, #27305f 0%, #5a4378 45%, #91505e 80%, #9f5641 100%)',
  'partly-twilight': 'linear-gradient(180deg, #2c3460 0%, #5f4d7c 50%, #985a63 100%)',
}

export function skyGradient(s: SkyState, theme: 'dynamic' | 'midnight' = 'dynamic'): string {
  if (theme === 'midnight') return 'linear-gradient(180deg, #000 0%, #0a0c12 100%)'
  if (s.period === 'twilight') {
    return GRADIENTS[`${s.kind}-twilight`] ?? GRADIENTS[`${s.kind}-night`] ?? GRADIENTS['clear-twilight']
  }
  return GRADIENTS[s.key] ?? GRADIENTS['cloudy-day']
}

/** Colour for a temperature in °C, used by the 10-day range bars. */
export function tempColor(c: number): string {
  const stops: Array<[number, [number, number, number]]> = [
    [-20, [129, 108, 255]],
    [-5, [92, 160, 255]],
    [5, [72, 210, 226]],
    [14, [130, 220, 140]],
    [21, [246, 213, 92]],
    [28, [255, 160, 64]],
    [36, [255, 92, 72]],
  ]
  if (c <= stops[0][0]) return `rgb(${stops[0][1].join(',')})`
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i]
    const [t0, c0] = stops[i - 1]
    if (c <= t1) {
      const f = (c - t0) / (t1 - t0)
      return `rgb(${c0.map((v, j) => Math.round(v + (c1[j] - v) * f)).join(',')})`
    }
  }
  return `rgb(${stops[stops.length - 1][1].join(',')})`
}
