import type { Page } from '@playwright/test'
import type { GeocodeResult, WeatherResponse } from '../api/_lib/openMeteo'

export interface Scenario {
  code: number
  tempC: number
  /** Hours since local sunrise; > 12 means after sunset (night). */
  hoursSinceSunrise: number
  utcOffsetSeconds: number
  precipProb?: number
  windKph?: number
  /** Weather code the next hours turn into (for notable-change banners). */
  laterCode?: number
}

export const CITIES = {
  cupertino: { name: 'Cupertino', lat: 37.323, lon: -122.0322, country: 'United States', admin1: 'California' },
  reykjavik: { name: 'Reykjavík', lat: 64.1355, lon: -21.8954, country: 'Iceland', admin1: 'Capital Region' },
  london: { name: 'London', lat: 51.5085, lon: -0.1257, country: 'United Kingdom', admin1: 'England' },
  sapporo: { name: 'Sapporo', lat: 43.0667, lon: 141.35, country: 'Japan', admin1: 'Hokkaido' },
  austin: { name: 'Austin', lat: 30.2672, lon: -97.7431, country: 'United States', admin1: 'Texas' },
} as const

export const SCENARIOS: Record<keyof typeof CITIES, Scenario> = {
  cupertino: { code: 0, tempC: 24, hoursSinceSunrise: 5.5, utcOffsetSeconds: -25200 },
  reykjavik: { code: 1, tempC: -2, hoursSinceSunrise: 14, utcOffsetSeconds: 0, windKph: 18 },
  london: { code: 63, tempC: 11, hoursSinceSunrise: 4, utcOffsetSeconds: 0, precipProb: 90, windKph: 28 },
  sapporo: { code: 73, tempC: -4, hoursSinceSunrise: 3, utcOffsetSeconds: 32400, precipProb: 80, windKph: 14 },
  austin: { code: 2, tempC: 27, hoursSinceSunrise: 6, utcOffsetSeconds: -18000, precipProb: 10, laterCode: 95 },
}

const H = 3600

/** Builds a normalized /api/weather payload whose sunrise/sunset sit around "now". */
export function makeWeather(lat: number, lon: number, s: Scenario): WeatherResponse {
  const now = Math.floor(Date.now() / 1000)
  const sunrise = now - Math.round(s.hoursSinceSunrise * H)
  const dayLen = 11 * H
  const sunset = sunrise + dayLen
  const nowHour = Math.floor(now / H) * H
  // Pick a UTC offset that puts local sunrise near 6:45 AM, so clocks and sun times look realistic.
  const DAY = 24 * H
  const wantLocal = 6.75 * H + s.hoursSinceSunrise * H
  const rawOffset = (((wantLocal - (now % DAY)) % DAY) + DAY) % DAY
  const utcOffsetSeconds = Math.round((rawOffset > DAY / 2 ? rawOffset - DAY : rawOffset) / 900) * 900
  const isDayAt = (t: number) => {
    const into = (((t - sunrise) % (24 * H)) + 24 * H) % (24 * H)
    return into < dayLen
  }
  const wave = (t: number) => Math.sin(((t - sunrise) / (24 * H)) * Math.PI * 2 - 0.3)
  const hourly = Array.from({ length: 48 }, (_, i) => {
    const t = nowHour + i * H
    const code = s.laterCode && i >= 2 && i < 6 ? s.laterCode : s.code
    return {
      time: t,
      tempC: Math.round((s.tempC + 4 * wave(t) - 4 * wave(now)) * 10) / 10,
      code,
      isDay: isDayAt(t),
      precipProb: s.laterCode && i >= 2 && i < 6 ? 70 : Math.max(0, (s.precipProb ?? 0) - i * 2),
      precipMm: s.precipProb && s.precipProb > 50 ? 0.6 : 0,
      uvIndex: isDayAt(t) ? Math.max(0, Math.round(7 * Math.sin(((t - sunrise) / dayLen) * Math.PI))) : 0,
    }
  })
  const dayStart = sunrise - 6 * H
  const daily = Array.from({ length: 10 }, (_, i) => ({
    time: dayStart + i * 24 * H,
    code: i === 0 ? s.code : [s.code, 2, 3, 61, 0, 1, 80, 3, 0, 2][i],
    maxC: Math.round(s.tempC + 3 + Math.sin(i) * 3),
    minC: Math.round(s.tempC - 6 + Math.cos(i) * 2),
    sunrise: sunrise + i * 24 * H,
    sunset: sunset + i * 24 * H,
    uvMax: 6,
    precipMm: i === 3 ? 4 : 0,
    precipProbMax: i === 0 ? (s.precipProb ?? 0) : [0, 10, 20, 70, 0, 10, 60, 20, 0, 10][i],
    windMaxKph: 20,
  }))
  const isDay = isDayAt(now)
  return {
    location: { lat, lon, timezone: 'Etc/Test', timezoneAbbreviation: 'TST', utcOffsetSeconds, elevation: 20 },
    current: {
      time: now,
      tempC: s.tempC,
      feelsLikeC: s.tempC - 2,
      humidity: s.precipProb && s.precipProb > 50 ? 88 : 46,
      dewPointC: s.tempC - 8,
      isDay,
      code: s.code,
      precipitationMm: s.precipProb && s.precipProb > 50 ? 0.8 : 0,
      cloudCover: s.code === 0 ? 2 : 80,
      pressureHpa: 1014.2,
      pressureTrend: -1.2,
      windKph: s.windKph ?? 11,
      windDirDeg: 225,
      gustKph: (s.windKph ?? 11) * 1.6,
      visibilityM: s.code >= 60 ? 6000 : 24000,
      uvIndex: isDay ? 5 : 0,
    },
    hourly,
    daily,
    precipLast24hMm: s.precipProb && s.precipProb > 50 ? 7.4 : 0,
    precipNext24hMm: s.precipProb && s.precipProb > 50 ? 5.1 : 0,
    airQuality: { usAqi: 38, pm25: 6.2, pm10: 11, ozone: 60 },
    source: 'open-meteo',
    fetchedAt: now,
  }
}

const geocodeResults = (q: string): GeocodeResult[] =>
  Object.values(CITIES)
    .filter((c) => c.name.toLowerCase().startsWith(q.toLowerCase().slice(0, 3)))
    .map((c, i): GeocodeResult => ({ id: 1000 + i, ...c, countryCode: null, timezone: null, population: null }))
    .concat(q.toLowerCase().startsWith('lon') ? EXTRA_LON : [])

const EXTRA_LON: GeocodeResult[] = [
  { id: 2001, name: 'London', admin1: 'Ontario', country: 'Canada', lat: 42.9834, lon: -81.233, countryCode: 'CA', timezone: null, population: null },
  { id: 2002, name: 'Long Beach', admin1: 'California', country: 'United States', lat: 33.767, lon: -118.1892, countryCode: 'US', timezone: null, population: null },
  { id: 2003, name: 'Londrina', admin1: 'Paraná', country: 'Brazil', lat: -23.3103, lon: -51.1628, countryCode: 'BR', timezone: null, population: null },
]

function scenarioFor(lat: number, lon: number): Scenario {
  const hit = (Object.keys(CITIES) as Array<keyof typeof CITIES>).find((k) => Math.abs(CITIES[k].lat - lat) < 0.05 && Math.abs(CITIES[k].lon - lon) < 0.05)
  return hit ? SCENARIOS[hit] : { code: 3, tempC: 15, hoursSinceSunrise: 6, utcOffsetSeconds: 0 }
}

/** Mocks every /api route (and blocks third-party weather hosts) for a page. */
export async function mockApi(page: Page, opts: { failWeather?: boolean } = {}) {
  await page.route(/open-meteo\.com|nominatim/, (r) => r.abort())
  await page.route('**/api/weather?*', (route) => {
    if (opts.failWeather) return route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: { code: 'upstream', message: 'Upstream failed' } }) })
    const u = new URL(route.request().url())
    const lat = Number(u.searchParams.get('lat'))
    const lon = Number(u.searchParams.get('lon'))
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(makeWeather(lat, lon, scenarioFor(lat, lon))) })
  })
  await page.route('**/api/geocode?*', (route) => {
    const q = new URL(route.request().url()).searchParams.get('q') ?? ''
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ query: q, results: geocodeResults(q) }) })
  })
  await page.route('**/api/reverse-geocode?*', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ name: 'Cupertino', admin1: 'California', country: 'United States' }) }))
}

/** Seeds saved cities in localStorage before the app loads. */
export async function seedPlaces(page: Page, keys: Array<keyof typeof CITIES>, selected?: keyof typeof CITIES) {
  const places = keys.map((k, i) => ({ id: `local-${k}`, ...CITIES[k], sortOrder: i }))
  const sel = selected ? `${CITIES[selected].lat},${CITIES[selected].lon}` : null
  await page.addInitScript(
    ([p, s]) => {
      if (sessionStorage.getItem('seeded')) return
      sessionStorage.setItem('seeded', '1')
      localStorage.setItem('wx:places', JSON.stringify(p))
      if (s) localStorage.setItem('wx:selected', JSON.stringify(s))
    },
    [places, sel] as const,
  )
}
