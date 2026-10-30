import { fetchWeather, parseCoord } from './_lib/openMeteo.js'
import { errorResponse, json } from './_lib/http.js'

/** GET /api/weather?lat=40.71&lon=-74.01 → normalized current, 48h hourly, 10-day and air quality. */
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
