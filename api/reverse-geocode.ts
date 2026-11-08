import { parseCoord, reverseGeocode } from './_lib/openMeteo.js'
import { errorResponse, json } from './_lib/http.js'

/**
 * GET /api/reverse-geocode?lat&lon → the place name for "My Location".
 * Same long cache as search. A GPS fix rounded to ~1 km is stable, and this
 * is the call I most want on the server: Nominatim, not the browser.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url)
    const lat = parseCoord(url.searchParams.get('lat'), 'lat')
    const lon = parseCoord(url.searchParams.get('lon'), 'lon')
    return json(await reverseGeocode(lat, lon), { sMaxAge: 86400, swr: 604800 })
  } catch (err) {
    return errorResponse(err)
  }
}
