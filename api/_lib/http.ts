import { InputError, UpstreamError } from './openMeteo.js'

/** JSON response with CDN caching: browsers keep it briefly, Vercel's edge keeps it longer. */
export function json(body: unknown, init: { status?: number; sMaxAge?: number; swr?: number } = {}): Response {
  const { status = 200, sMaxAge = 600, swr = 1800 } = init
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8' })
  if (status === 200) {
    headers.set('Cache-Control', `public, max-age=60, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`)
  } else {
    headers.set('Cache-Control', 'no-store')
  }
  return new Response(JSON.stringify(body), { status, headers })
}

export function errorResponse(err: unknown): Response {
  if (err instanceof InputError) return json({ error: { code: 'bad_request', message: err.message } }, { status: 400 })
  if (err instanceof UpstreamError) return json({ error: { code: 'upstream_error', message: err.message } }, { status: 502 })
  console.error(err)
  return json({ error: { code: 'internal_error', message: 'Something went wrong' } }, { status: 500 })
}
