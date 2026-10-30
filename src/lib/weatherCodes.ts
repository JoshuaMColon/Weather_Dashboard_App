/** WMO weather interpretation codes (as used by Open-Meteo) → label + visual category. */
export type SkyKind = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm'

interface CodeInfo {
  label: string
  kind: SkyKind
}

const CODES: Record<number, CodeInfo> = {
  0: { label: 'Clear', kind: 'clear' },
  1: { label: 'Mostly Clear', kind: 'clear' },
  2: { label: 'Partly Cloudy', kind: 'partly' },
  3: { label: 'Cloudy', kind: 'cloudy' },
  45: { label: 'Foggy', kind: 'fog' },
  48: { label: 'Freezing Fog', kind: 'fog' },
  51: { label: 'Light Drizzle', kind: 'drizzle' },
  53: { label: 'Drizzle', kind: 'drizzle' },
  55: { label: 'Heavy Drizzle', kind: 'drizzle' },
  56: { label: 'Freezing Drizzle', kind: 'drizzle' },
  57: { label: 'Freezing Drizzle', kind: 'drizzle' },
  61: { label: 'Light Rain', kind: 'rain' },
  63: { label: 'Rain', kind: 'rain' },
  65: { label: 'Heavy Rain', kind: 'rain' },
  66: { label: 'Freezing Rain', kind: 'rain' },
  67: { label: 'Freezing Rain', kind: 'rain' },
  71: { label: 'Light Snow', kind: 'snow' },
  73: { label: 'Snow', kind: 'snow' },
  75: { label: 'Heavy Snow', kind: 'snow' },
  77: { label: 'Snow Grains', kind: 'snow' },
  80: { label: 'Rain Showers', kind: 'rain' },
  81: { label: 'Rain Showers', kind: 'rain' },
  82: { label: 'Heavy Showers', kind: 'rain' },
  85: { label: 'Snow Showers', kind: 'snow' },
  86: { label: 'Heavy Snow Showers', kind: 'snow' },
  95: { label: 'Thunderstorms', kind: 'storm' },
  96: { label: 'Thunderstorms & Hail', kind: 'storm' },
  99: { label: 'Severe Thunderstorms', kind: 'storm' },
}

export function codeInfo(code: number): CodeInfo {
  return CODES[code] ?? { label: 'Unknown', kind: 'cloudy' }
}

export const isWet = (code: number) => ['drizzle', 'rain', 'storm', 'snow'].includes(codeInfo(code).kind)
