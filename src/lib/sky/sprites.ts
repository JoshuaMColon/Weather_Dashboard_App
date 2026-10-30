/**
 * Pre-rendered sprites for the sky engine. Each is drawn once (lazily) into a
 * small offscreen canvas and then blitted with drawImage every frame, which is
 * far cheaper than rebuilding gradients per frame.
 */
type RGB = readonly [number, number, number]

const cache = new Map<string, HTMLCanvasElement>()

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

function memo(key: string, make: () => HTMLCanvasElement) {
  let c = cache.get(key)
  if (!c) {
    c = make()
    cache.set(key, c)
  }
  return c
}

/** Small deterministic PRNG so every cloud variant looks the same between visits. */
export function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rgba = ([r, g, b]: RGB, a: number) => `rgba(${r},${g},${b},${a})`

export const CLOUD_W = 560
export const CLOUD_H = 260

/** A soft, flat-bottomed cumulus built from overlapping radial puffs, shaded underneath. */
export function cloudSprite(color: RGB, shade: number, variant: number) {
  return memo(`cloud:${color.join(',')}:${shade}:${variant}`, () => {
    const [c, ctx] = canvas(CLOUD_W, CLOUD_H)
    const rnd = mulberry(variant * 7919 + 17)
    const puffs = 12 + Math.floor(rnd() * 6)
    for (let i = 0; i < puffs; i++) {
      const f = i / (puffs - 1)
      const x = 70 + f * (CLOUD_W - 140) + (rnd() - 0.5) * 40
      const hump = Math.sin(f * Math.PI) // taller in the middle
      const r = 46 + hump * (50 + rnd() * 40)
      const y = CLOUD_H - 70 - hump * (30 + rnd() * 40)
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, rgba(color, 0.9))
      g.addColorStop(0.55, rgba(color, 0.55))
      g.addColorStop(1, rgba(color, 0))
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    // Darker underside for volume.
    if (shade > 0) {
      ctx.globalCompositeOperation = 'source-atop'
      const s = ctx.createLinearGradient(0, CLOUD_H * 0.35, 0, CLOUD_H)
      s.addColorStop(0, 'rgba(0,0,0,0)')
      s.addColorStop(1, `rgba(10,20,40,${shade})`)
      ctx.fillStyle = s
      ctx.fillRect(0, 0, CLOUD_W, CLOUD_H)
    }
    return c
  })
}

/** Radial glow (sun, moon, lightning). */
export function glowSprite(color: RGB, stops: Array<[number, number]> = [[0, 0.9], [0.18, 0.45], [0.45, 0.12], [1, 0]]) {
  return memo(`glow:${color.join(',')}:${stops.flat().join(',')}`, () => {
    const size = 256
    const [c, ctx] = canvas(size, size)
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    for (const [o, a] of stops) g.addColorStop(o, rgba(color, a))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    return c
  })
}

/** Thin sun rays fading out from the centre; rotated slowly for a lens shimmer. */
export function raysSprite(count: number) {
  return memo(`rays:${count}`, () => {
    const size = 512
    const [c, ctx] = canvas(size, size)
    const cx = size / 2
    const rnd = mulberry(count)
    ctx.fillStyle = '#fff'
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rnd() * 0.2
      const wdt = 0.025 + rnd() * 0.05
      ctx.beginPath()
      ctx.moveTo(cx, cx)
      ctx.lineTo(cx + Math.cos(a - wdt) * cx, cx + Math.sin(a - wdt) * cx)
      ctx.lineTo(cx + Math.cos(a + wdt) * cx, cx + Math.sin(a + wdt) * cx)
      ctx.closePath()
      ctx.globalAlpha = 0.35 + rnd() * 0.5
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'destination-in'
    const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx)
    g.addColorStop(0, 'rgba(255,255,255,0.5)')
    g.addColorStop(0.3, 'rgba(255,255,255,0.18)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    return c
  })
}

export const MIST_W = 1024
export const MIST_H = 260

/** A long, soft band of mist; tiles horizontally. */
export function mistSprite(variant: number) {
  return memo(`mist:${variant}`, () => {
    const [c, ctx] = canvas(MIST_W, MIST_H)
    const rnd = mulberry(variant * 131 + 7)
    for (let i = 0; i < 9; i++) {
      // Keep blobs away from the edges so the band tiles seamlessly.
      const x = 120 + rnd() * (MIST_W - 240)
      const y = MIST_H / 2 + (rnd() - 0.5) * 60
      const rx = 160 + rnd() * 160
      const ry = 50 + rnd() * 40
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(rx / ry, 1)
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, ry)
      g.addColorStop(0, 'rgba(235,240,245,0.55)')
      g.addColorStop(1, 'rgba(235,240,245,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(0, 0, ry, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    return c
  })
}

/** Soft snowflake. */
export function flakeSprite() {
  return memo('flake', () => {
    const [c, ctx] = canvas(32, 32)
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.35, 'rgba(255,255,255,0.85)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 32, 32)
    return c
  })
}

/** A water bead on glass: clear centre, bright rim, highlight and a shadowed lower edge. */
export function beadSprite() {
  return memo('bead', () => {
    const s = 48
    const [c, ctx] = canvas(s, s)
    const r = s / 2 - 2
    const body = ctx.createRadialGradient(s / 2, s / 2 - 3, r * 0.2, s / 2, s / 2, r)
    body.addColorStop(0, 'rgba(255,255,255,0.04)')
    body.addColorStop(0.75, 'rgba(255,255,255,0.12)')
    body.addColorStop(1, 'rgba(255,255,255,0.42)')
    ctx.fillStyle = body
    ctx.beginPath()
    ctx.arc(s / 2, s / 2, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,10,30,0.22)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(s / 2, s / 2 + 1, r - 1, 0.15 * Math.PI, 0.85 * Math.PI)
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.beginPath()
    ctx.ellipse(s / 2 - r * 0.35, s / 2 - r * 0.4, r * 0.22, r * 0.13, -0.6, 0, Math.PI * 2)
    ctx.fill()
    return c
  })
}
