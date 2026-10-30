import { geocode, parseQuery } from './_lib/openMeteo.js'
import { errorResponse, json } from './_lib/http.js'

/** GET /api/geocode?q=San%20Fran → up to 8 matching places. */
export async function GET(request: Request): Promise<Response> {
  try {
    const q = parseQuery(new URL(request.url).searchParams.get('q'))
    return json({ query: q, results: await geocode(q) }, { sMaxAge: 86400, swr: 604800 })
  } catch (err) {
    return errorResponse(err)
  }
}
