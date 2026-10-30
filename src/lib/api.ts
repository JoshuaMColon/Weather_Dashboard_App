import {
  fetchWeather as fetchDirect,
  geocode as geocodeDirect,
  type GeocodeResult,
  type ReverseGeocodeResult,
  type WeatherResponse,
} from '../../api/_lib/openMeteo'

export type { GeocodeResult, WeatherResponse }

const round2 = (n: number) => Math.round(n * 100) / 100

class ApiUnavailable extends Error {}

async function api<T>(path: string, signal?: AbortSignal): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, { signal, headers: { Accept: 'application/json' } })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new ApiUnavailable()
  }
  const type = res.headers.get('content-type') ?? ''
  // A static host (GitHub Pages) answers /api with 404 HTML: fall back to calling Open-Meteo directly.
  if (res.status === 404 || !type.includes('application/json')) throw new ApiUnavailable()
  const body = await res.json()
  if (!res.ok) throw new Error(body?.error?.message ?? `Request failed (${res.status})`)
  return body as T
}

export async function getWeather(lat: number, lon: number, signal?: AbortSignal): Promise<WeatherResponse> {
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
    return { name: 'My Location', admin1: null, country: null }
  }
}
