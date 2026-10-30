import { useEffect, useRef } from 'react'
import type { SkyState } from '../lib/sky'

interface Props {
  sky: SkyState
  gradient: string
  reducedMotion: boolean
}

/** Full-screen animated sky: gradient + soft clouds (CSS) + rain/snow/stars (canvas). */
export function Sky({ sky, gradient, reducedMotion }: Props) {
  const cloudy = ['partly', 'cloudy', 'fog', 'drizzle', 'rain', 'snow', 'storm'].includes(sky.kind)
  const cloudOpacity = sky.kind === 'partly' ? 0.35 : sky.kind === 'fog' ? 0.6 : 0.5
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true" data-sky={sky.key}>
      <div key={gradient} className="sky-fade absolute inset-0" style={{ background: gradient }} />
      {sky.kind === 'clear' && sky.period === 'day' && <div className="sun-glow absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full" />}
      {sky.period === 'twilight' && <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#ff9e6b]/25 to-transparent" />}
      {cloudy && (
        <div className={`absolute inset-0 ${reducedMotion ? '' : 'clouds-drift'}`} style={{ opacity: cloudOpacity }}>
          <div className="cloud left-[-10%] top-[6%] h-[220px] w-[520px]" />
          <div className="cloud left-[45%] top-[18%] h-[180px] w-[460px] [animation-delay:-20s]" />
          <div className="cloud left-[10%] top-[42%] h-[200px] w-[600px] opacity-70 [animation-delay:-40s]" />
        </div>
      )}
      {sky.kind === 'storm' && !reducedMotion && <div className="lightning absolute inset-0 bg-white" />}
      <Particles sky={sky} reducedMotion={reducedMotion} />
    </div>
  )
}

function Particles({ sky, reducedMotion }: { sky: SkyState; reducedMotion: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const mode =
    sky.kind === 'rain' || sky.kind === 'storm' ? 'rain' : sky.kind === 'drizzle' ? 'drizzle' : sky.kind === 'snow' ? 'snow' : sky.period === 'night' && (sky.kind === 'clear' || sky.kind === 'partly') ? 'stars' : null

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !mode) return
    // Reduced motion: keep static stars, skip falling precipitation entirely.
    if (reducedMotion && mode !== 'stars') return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let w = 0
    let h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const count = mode === 'rain' ? 130 : mode === 'drizzle' ? 60 : mode === 'snow' ? 110 : 140
    const rand = (a: number, b: number) => a + Math.random() * (b - a)
    const parts = Array.from({ length: count }, () => ({
      x: rand(0, w),
      y: mode === 'stars' ? rand(0, h * 0.65) : rand(-h, h),
      v: mode === 'snow' ? rand(0.3, 1.1) : mode === 'stars' ? rand(0.002, 0.02) : rand(9, 16),
      s: mode === 'snow' ? rand(1.2, 3.4) : mode === 'stars' ? rand(0.4, 1.4) : rand(10, 22),
      p: rand(0, Math.PI * 2),
    }))

    let raf = 0
    let last = performance.now()
    const draw = (now: number) => {
      const dt = Math.min(2.5, (now - last) / 16.7)
      last = now
      ctx.clearRect(0, 0, w, h)
      for (const q of parts) {
        if (mode === 'stars') {
          q.p += q.v * dt
          ctx.globalAlpha = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(q.p))
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(q.x, q.y, q.s, 0, Math.PI * 2)
          ctx.fill()
        } else if (mode === 'snow') {
          q.y += q.v * dt
          q.p += 0.01 * dt
          q.x += Math.sin(q.p) * 0.4 * dt
          if (q.y > h + 5) {
            q.y = -5
            q.x = rand(0, w)
          }
          ctx.globalAlpha = 0.75
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(q.x, q.y, q.s, 0, Math.PI * 2)
          ctx.fill()
        } else {
          q.y += q.v * dt
          q.x -= q.v * 0.12 * dt
          if (q.y > h) {
            q.y = rand(-40, 0)
            q.x = rand(0, w + 60)
          }
          ctx.globalAlpha = mode === 'drizzle' ? 0.25 : 0.35
          ctx.strokeStyle = '#cfe6ff'
          ctx.lineWidth = mode === 'drizzle' ? 1 : 1.3
          ctx.beginPath()
          ctx.moveTo(q.x, q.y)
          ctx.lineTo(q.x + q.s * 0.12, q.y - q.s)
          ctx.stroke()
        }
      }
      if (!reducedMotion && !document.hidden) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    const onVis = () => {
      if (!document.hidden && !reducedMotion) {
        last = performance.now()
        raf = requestAnimationFrame(draw)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [mode, reducedMotion])

  if (!mode) return null
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />
}
