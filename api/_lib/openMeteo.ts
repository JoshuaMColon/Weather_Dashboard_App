/**
 * Open-Meteo client and the normalizer that turns its payload into what the UI renders.
 *
 * There is no weather API key to hide. Open-Meteo is keyless, so the thing I keep
 * off the browser is Nominatim: their usage policy wants an identifying User-Agent
 * and they block anonymous browser traffic. Forecast and search can fall back to a
 * direct call when /api is missing (a static host). Reverse geocoding never does.
 *
 * I always request metric. The UI converts to °F or mph, so one cached body covers
 * every unit choice instead of a cache entry per preference.
 */

export interface CurrentConditions {
  time: number
  tempC: number
  feelsLikeC: number
  humidity: number
  dewPointC: number
  isDay: boolean
  code: number
  precipitationMm: number
  cloudCover: number
  pressureHpa: number
  /** hPa change over the previous 3 hours (positive = rising). */
  pressureTrend: number
  windKph: number
  windDirDeg: number
  gustKph: number
  visibilityM: number
  uvIndex: number
}

export interface HourlyPoint {
  time: number
  tempC: number
  code: number
  isDay: boolean
  precipProb: number
  precipMm: number
  uvIndex: number
}

export interface DailyPoint {
  /** Local midnight, unix seconds. */
  time: number
  code: number
  maxC: number
  minC: number
  sunrise: number
  sunset: number
  uvMax: number
  precipMm: number
  precipProbMax: number
  windMaxKph: number
}

export interface AirQuality {
  usAqi: number
  pm25: number | null
  pm10: number | null
  ozone: number | null
}

export interface WeatherResponse {
  location: {
    lat: number
    lon: number
    timezone: string
    timezoneAbbreviation: string
    utcOffsetSeconds: number
    elevation: number
  }
  current: CurrentConditions
  /** Next 48 hours, starting at the current hour. */
  hourly: HourlyPoint[]
  /** 10 days starting today (location's local date). */
  daily: DailyPoint[]
  precipLast24hMm: number
  precipNext24hMm: number
  airQuality: AirQuality | null
  source: 'open-meteo'
  fetchedAt: number
}

export interface GeocodeResult {
  id: number
  name: string
  lat: number
  lon: number
  country: string | null
  countryCode: string | null
  admin1: string | null
  timezone: string | null
  population: number | null
}

export interface ReverseGeocodeResult {
  name: string
  admin1: string | null
  country: string | null
}

export class InputError extends Error {}
export class UpstreamError extends Error {}

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'

/**
 * Validate a coordinate and round to 2 decimals (~1 km).
 * Nearby lookups then share one CDN entry. That shared cache is how I stay
 * polite to Open-Meteo; I don't run a rate limiter of my own.
 */
export function parseCoord(raw: string | null, kind: 'lat' | 'lon'): number {
  if (raw === null || raw.trim() === '') throw new InputError(`Missing "${kind}" query parameter`)
  const n = Number(raw)
  const limit = kind === 'lat' ? 90 : 180
  if (!Number.isFinite(n) || Math.abs(n) > limit) {
    throw new InputError(`"${kind}" must be a number between -${limit} and ${limit}`)
  }
  return Math.round(n * 100) / 100
}

export function parseQuery(raw: string | null): string {
  const q = (raw ?? '').replace(/\s+/g, ' ').trim()
  // Short queries match half the planet, and a long one is someone pasting a sentence.
  if (q.length < 2) throw new InputError('"q" must be at least 2 characters')
  if (q.length > 80) throw new InputError('"q" must be at most 80 characters')
  return q
}

/** 8s cap. A hung upstream should become a 502 the UI can retry, not a function that sits until the platform kills it. */
async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, { ...init, signal: init?.signal ?? AbortSignal.timeout(8000) })
  } catch (err) {
    throw new UpstreamError(`Weather service unreachable: ${(err as Error).message}`)
  }
  if (!res.ok) throw new UpstreamError(`Weather service responded ${res.status}`)
  return (await res.json()) as T
}

const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)

interface RawForecast {
  latitude: number
  longitude: number
  timezone: string
  timezone_abbreviation: string
  utc_offset_seconds: number
  elevation: number
  current: Record<string, number>
  hourly: Record<string, number[]>
  daily: Record<string, number[]>
}

/**
 * One forecast call covers current conditions, the previous 24h (pressure trend
 * and "already rained"), the next 48h, and 10 days. Air quality is a second host.
 * If that call fails I still return the forecast; the AQI tile just stays empty.
 */
export async function fetchWeather(lat: number, lon: number): Promise<WeatherResponse> {
  const forecastParams = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: [
      'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day', 'precipitation',
      'weather_code', 'cloud_cover', 'pressure_msl', 'wind_speed_10m', 'wind_direction_10m',
      'wind_gusts_10m', 'dew_point_2m', 'visibility', 'uv_index',
    ].join(','),
    hourly: ['temperature_2m', 'weather_code', 'precipitation_probability', 'precipitation', 'is_day', 'uv_index', 'pressure_msl'].join(','),
    daily: [
      'weather_code', 'temperature_2m_max', 'temperature_2m_min', 'sunrise', 'sunset', 'uv_index_max',
      'precipitation_sum', 'precipitation_probability_max', 'wind_speed_10m_max',
    ].join(','),
    timezone: 'auto',
    timeformat: 'unixtime',
    forecast_days: '10',
    past_hours: '24',
    forecast_hours: '48',
  })
  const airParams = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'us_aqi,pm2_5,pm10,ozone',
    timeformat: 'unixtime',
  })

  const [raw, air] = await Promise.all([
    getJson<RawForecast>(`${FORECAST_URL}?${forecastParams}`),
    // Nice-to-have. A 502 from the air-quality host must not take the forecast down with it.
    getJson<{ current?: Record<string, number> }>(`${AIR_URL}?${airParams}`).catch(() => null),
  ])
  return normalizeWeather(raw, air?.current ?? null)
}

export function normalizeWeather(raw: RawForecast, air: Record<string, number> | null): WeatherResponse {
  const c = raw.current
  const h = raw.hourly
  const d = raw.daily
  const nowHour = Math.floor(num(c.time) / 3600) * 3600

  const hourlyAll: HourlyPoint[] = h.time.map((time, i) => ({
    time,
    tempC: num(h.temperature_2m?.[i]),
    code: num(h.weather_code?.[i]),
    isDay: num(h.is_day?.[i], 1) === 1,
    precipProb: num(h.precipitation_probability?.[i]),
    precipMm: num(h.precipitation?.[i]),
    uvIndex: num(h.uv_index?.[i]),
  }))
  const startIdx = Math.max(0, hourlyAll.findIndex((p) => p.time >= nowHour))
  const past = hourlyAll.slice(0, startIdx)
  const future = hourlyAll.slice(startIdx, startIdx + 48)
  const sum = (pts: HourlyPoint[]) => Math.round(pts.reduce((a, p) => a + p.precipMm, 0) * 10) / 10

  const pressureNow = num(c.pressure_msl)
  const pressure3hAgo = h.pressure_msl?.[startIdx - 3]
  const pressureTrend = typeof pressure3hAgo === 'number' ? Math.round((pressureNow - pressure3hAgo) * 10) / 10 : 0

  return {
    location: {
      lat: raw.latitude,
      lon: raw.longitude,
      timezone: raw.timezone,
      timezoneAbbreviation: raw.timezone_abbreviation,
      utcOffsetSeconds: raw.utc_offset_seconds,
      elevation: raw.elevation,
    },
    current: {
      time: num(c.time),
      tempC: num(c.temperature_2m),
      feelsLikeC: num(c.apparent_temperature, num(c.temperature_2m)),
      humidity: num(c.relative_humidity_2m),
      dewPointC: num(c.dew_point_2m),
      isDay: num(c.is_day, 1) === 1,
      code: num(c.weather_code),
      precipitationMm: num(c.precipitation),
      cloudCover: num(c.cloud_cover),
      pressureHpa: pressureNow,
      pressureTrend,
      windKph: num(c.wind_speed_10m),
      windDirDeg: num(c.wind_direction_10m),
      gustKph: num(c.wind_gusts_10m),
      visibilityM: num(c.visibility, 10000),
      uvIndex: num(c.uv_index, future[0]?.uvIndex ?? 0),
    },
    hourly: future,
    daily: d.time.map((time, i) => ({
      time,
      code: num(d.weather_code?.[i]),
      maxC: num(d.temperature_2m_max?.[i]),
      minC: num(d.temperature_2m_min?.[i]),
      sunrise: num(d.sunrise?.[i]),
      sunset: num(d.sunset?.[i]),
      uvMax: num(d.uv_index_max?.[i]),
      precipMm: num(d.precipitation_sum?.[i]),
      precipProbMax: num(d.precipitation_probability_max?.[i]),
      windMaxKph: num(d.wind_speed_10m_max?.[i]),
    })),
    precipLast24hMm: sum(past.slice(-24)),
    precipNext24hMm: sum(future.slice(0, 24)),
    airQuality:
      air && typeof air.us_aqi === 'number'
        ? { usAqi: Math.round(air.us_aqi), pm25: air.pm2_5 ?? null, pm10: air.pm10 ?? null, ozone: air.ozone ?? null }
        : null,
    source: 'open-meteo',
    fetchedAt: Math.floor(Date.now() / 1000),
  }
}

interface RawGeocode {
  results?: Array<{
    id: number
    name: string
    latitude: number
    longitude: number
    country?: string
    country_code?: string
    admin1?: string
    timezone?: string
    population?: number
  }>
}

/**
 * City search. Four decimals (~10 m) is plenty for a pin and matches the
 * numeric(7,4) columns, so the same place round-trips to one upsert key
 * instead of a new row every time the float wobbles.
 */
export async function geocode(q: string, count = 8): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({ name: q, count: String(count), language: 'en', format: 'json' })
  const raw = await getJson<RawGeocode>(`${GEOCODE_URL}?${params}`)
  return (raw.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    lat: Math.round(r.latitude * 10000) / 10000,
    lon: Math.round(r.longitude * 10000) / 10000,
    country: r.country ?? null,
    countryCode: r.country_code ?? null,
    admin1: r.admin1 ?? null,
    timezone: r.timezone ?? null,
    population: r.population ?? null,
  }))
}

interface RawReverse {
  name?: string
  address?: Record<string, string>
}

/**
 * Reverse geocoding via Nominatim. Server only: the User-Agent below is the
 * identification their policy requires, and the browser client never calls this.
 * zoom=10 is city-level, which is the label "My Location" should get.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon), format: 'jsonv2', zoom: '10', 'accept-language': 'en' })
  const raw = await getJson<RawReverse>(`${REVERSE_URL}?${params}`, {
    headers: { 'User-Agent': 'WeatherDashboardApp/2.0 (+https://github.com/JoshuaMColon/Weather_Dashboard_App)' },
  })
  const a = raw.address ?? {}
  return {
    name: a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? raw.name ?? 'My Location',
    admin1: a.state ?? a.region ?? null,
    country: a.country ?? null,
  }
}
