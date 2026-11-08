import { fetchWeather, parseCoord } from './_lib/openMeteo.js'
import { errorResponse, json } from './_lib/http.js'

/**
 * GET /api/weather?lat=40.71&lon=-74.01
 * Validation and shaping live in openMeteo so the Vite dev plugin and the
 * direct-call fallback run the same code as this function. Ten minutes at the
 * edge, then thirty of stale-while-revalidate: a city people actually open
 * should be a cache hit, and a refresh never waits on a cold origin.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url)
    const lat = parseCoord(url.searchParams.get('lat'), 'lat')
    const lon = parseCoord(url.searchParams.get('lon'), 'lon')
    return json(await fetchWeather(lat, lon), { sMaxAge: 600, swr: 1800 })
  } catch (err) {
    return errorResponse(err)
  }
}
