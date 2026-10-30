import { useEffect, useRef, useState } from 'react'
import { SkyEngine } from '../lib/sky/engine'
import { useSkyScene } from '../lib/skyStore'
import { useReducedMotion } from '../hooks/useReducedMotion'

declare global {
  interface Window {
    __wxSky?: { readonly frames: number; readonly running: boolean; readonly scene: string | null; flash(hold?: boolean): boolean; release(): void }
  }
}

/**
 * Full-screen animated sky, mounted once at the app root: a crossfading CSS
 * gradient plus one canvas (sun, stars, parallax clouds, rain, snow, fog, wind,
 * lightning) painted by SkyEngine.
 */
export function Sky() {
  const scene = useSkyScene()
  const reduced = useReducedMotion()
  const ref = useRef<HTMLCanvasElement>(null)
  const engine = useRef<SkyEngine | null>(null)

  // Gradient crossfade: keep the previous layer underneath while the new one fades in.
  const [layers, setLayers] = useState<{ id: number; g: string }[]>([])
  const top = layers[layers.length - 1]
  if (scene && top?.g !== scene.gradient) setLayers([...layers.slice(-1), { id: (top?.id ?? 0) + 1, g: scene.gradient }])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const e = new SkyEngine(canvas)
    engine.current = e
    window.__wxSky = {
      get frames() {
        return e.frames
      },
      get running() {
        return e.running
      },
      get scene() {
        return e.scene
      },
      flash: (hold) => e.flash(hold),
      release: () => e.release(),
    }
    // Start animating once the page has loaded and the main thread is idle so
    // the sky never competes with first paint.
    let idle = 0
    let timer = 0
    const begin = () => {
      const ric = window.requestIdleCallback
      if (ric) idle = ric(() => e.start(), { timeout: 1500 })
      else timer = window.setTimeout(() => e.start(), 300)
    }
    if (document.readyState === 'complete') begin()
    else window.addEventListener('load', begin, { once: true })
    return () => {
      window.removeEventListener('load', begin)
      if (idle) window.cancelIdleCallback?.(idle)
      clearTimeout(timer)
      e.destroy()
      engine.current = null
      delete window.__wxSky
    }
  }, [])

  useEffect(() => {
    engine.current?.setReduced(reduced)
  }, [reduced])

  useEffect(() => {
    if (!scene) return
    engine.current?.setScene({
      kind: scene.sky.kind,
      period: scene.sky.period,
      intensity: scene.intensity,
      windKph: scene.windKph,
      windDirDeg: scene.windDirDeg,
    })
  }, [scene])

  const twilight = scene?.sky.period === 'twilight'
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0d1424]" aria-hidden="true" data-sky={scene?.sky.key ?? 'loading'}>
      {layers.map((l, i) => (
        <div key={l.id} className={`absolute inset-0 ${i > 0 ? 'sky-fade' : ''}`} style={{ background: l.g }} />
      ))}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#ff9e6b]/25 to-transparent transition-opacity duration-1000"
        style={{ opacity: twilight ? 1 : 0 }}
      />
      <canvas ref={ref} className="absolute inset-0 h-full w-full" data-testid="sky-canvas" />
    </div>
  )
}
