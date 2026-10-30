import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, type Connect, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Runs the Vercel functions in /api locally (`npm run dev` and `npm run preview`),
 * so the full stack works without `vercel dev` or a Vercel login.
 */
function localApi(): Plugin {
  const handler =
    (load: (path: string) => Promise<Record<string, unknown>>): Connect.NextHandleFunction =>
    async (req: IncomingMessage, res: ServerResponse, next) => {
      const url = new URL(req.url ?? '/', 'http://localhost')
      const match = /^\/api\/([a-z-]+)$/.exec(url.pathname)
      if (!match) return next()
      try {
        const mod = await load(`/api/${match[1]}.ts`)
        const fn = mod[req.method ?? 'GET'] as ((r: Request) => Promise<Response>) | undefined
        if (!fn) {
          res.statusCode = 405
          return res.end()
        }
        const response = await fn(new Request(url, { method: req.method }))
        res.statusCode = response.status
        response.headers.forEach((v, k) => res.setHeader(k, v))
        res.end(Buffer.from(await response.arrayBuffer()))
      } catch {
        res.statusCode = 404
        res.end('Not found')
      }
    }
  let server: ViteDevServer | undefined
  return {
    name: 'local-vercel-api',
    configureServer(s) {
      server = s
      s.middlewares.use(handler((p) => server!.ssrLoadModule(p)))
    },
    async configurePreviewServer(s) {
      // Preview has no module graph, so spin up a tiny SSR loader for /api.
      const { createServer } = await import('vite')
      const loader = await createServer({ server: { middlewareMode: true }, appType: 'custom', configFile: false, logLevel: 'error' })
      s.middlewares.use(handler((p) => loader.ssrLoadModule(p)))
      s.httpServer?.on('close', () => void loader.close())
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localApi()],
  build: { target: 'es2022', sourcemap: false },
})
