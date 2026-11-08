import {
  fetchWeather as fetchDirect,
  geocode as geocodeDirect,
  type GeocodeResult,
  type ReverseGeocodeResult,
  type WeatherResponse,
} from '../../api/_lib/openMeteo'

export type { GeocodeResult, WeatherResponse }

/**
 * Browser entry to weather data. I try /api first so production traffic hits
 * the cached, validated functions. If this host has no functions, forecast and
 * search call Open-Meteo directly. Reverse geocode has no direct path.
 */
const round2 = (n: number) => Math.round(n * 100) / 100

class ApiUnavailable extends Error {}

async function api<T>(path: string, signal?: AbortSignal): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, { signal, headers: { Accept: 'application/json' } })
  } catch (err) {
    // Abort is the search box cancelling a keystroke. Anything else (offline,
    // DNS, a static host with no /api) means the proxy isn't there.
    if ((err as Error).name === 'AbortError') throw err
    throw new ApiUnavailable()
  }
  const type = res.headers.get('content-type') ?? ''
  // GitHub Pages answers /api with a 404 HTML page. That is "no backend",
  // not a failed lookup. A JSON error from our function is a real failure.
  if (res.status === 404 || !type.includes('application/json')) throw new ApiUnavailable()
  const body = await res.json()
  if (!res.ok) throw new Error(body?.error?.message ?? `Request failed (${res.status})`)
  return body as T
}

export async function getWeather(lat: number, lon: number, signal?: AbortSignal): Promise<WeatherResponse> {
  // Same 2-decimal rounding as parseCoord, so the browser and the CDN agree on the cache key.
  const [la, lo] = [round2(lat), round2(lon)]
  try {
    return await api<WeatherResponse>(`/api/weather?lat=${la}&lon=${lo}`, signal)
  } catch (err) {
    if (err instanceof ApiUnavailable) return fetchDirect(la, lo)
    throw err
  }
}

export async function searchPlaces(q: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  try {
    return (await api<{ results: GeocodeResult[] }>(`/api/geocode?q=${encodeURIComponent(q)}`, signal)).results
  } catch (err) {
    if (err instanceof ApiUnavailable) return geocodeDirect(q)
    throw err
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult> {
  try {
    return await api<ReverseGeocodeResult>(`/api/reverse-geocode?lat=${round2(lat)}&lon=${round2(lon)}`)
  } catch {
    // Nominatim stays on the server. If /api is down I label the pin and move on
    // rather than call OpenStreetMap from the browser.
    return { name: 'My Location', admin1: null, country: null }
  }
}
