export type TempUnit = 'F' | 'C'
export type WindUnit = 'mph' | 'kmh' | 'ms' | 'kn'
export type Theme = 'dynamic' | 'midnight'

export interface Preferences {
  units: TempUnit
  windUnit: WindUnit
  theme: Theme
}

export const DEFAULT_PREFS: Preferences = { units: 'F', windUnit: 'mph', theme: 'dynamic' }

export const toTemp = (c: number, u: TempUnit) => (u === 'F' ? c * 1.8 + 32 : c)
export const fmtTemp = (c: number, u: TempUnit) => `${Math.round(toTemp(c, u))}°`

export function fmtWind(kph: number, u: WindUnit): { value: number; unit: string } {
  switch (u) {
    case 'mph':
      return { value: Math.round(kph / 1.609), unit: 'mph' }
    case 'ms':
      return { value: Math.round(kph / 3.6), unit: 'm/s' }
    case 'kn':
      return { value: Math.round(kph / 1.852), unit: 'kn' }
    default:
      return { value: Math.round(kph), unit: 'km/h' }
  }
}

/** Imperial when the user picks °F (US convention), metric otherwise. */
export const fmtPrecip = (mm: number, u: TempUnit) =>
  u === 'F' ? `${(mm / 25.4).toFixed(mm > 0 && mm < 2.5 ? 2 : 1).replace(/\.?0+$/, '') || '0'}″` : `${Math.round(mm * 10) / 10} mm`

export const fmtDistance = (m: number, u: TempUnit) =>
  u === 'F' ? `${Math.round((m / 1609.34) * (m < 16000 ? 10 : 1)) / (m < 16000 ? 10 : 1)} mi` : `${Math.round((m / 1000) * (m < 10000 ? 10 : 1)) / (m < 10000 ? 10 : 1)} km`

export const fmtPressure = (hpa: number, u: TempUnit) =>
  u === 'F' ? { value: (hpa * 0.02953).toFixed(2), unit: 'inHg' } : { value: String(Math.round(hpa)), unit: 'hPa' }

export function compass(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16]
}
