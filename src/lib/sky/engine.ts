import type { SkyKind } from '../weatherCodes'
import type { Period } from '../sky'
import { CLOUD_H, CLOUD_W, MIST_H, MIST_W, beadSprite, cloudSprite, flakeSprite, glowSprite, mistSprite, raysSprite } from './sprites'

/** Everything the engine needs to paint a scene. */
export interface SceneSpec {
  kind: SkyKind
  period: Period
  /** 0..1 precipitation intensity derived from the WMO code. */
  intensity: number
  windKph: number
  /** Meteorological direction the wind blows FROM, degrees. */
  windDirDeg: number
}

interface Env {
  w: number
  h: number
  /** Particle multiplier: fewer particles on small screens. */
  density: number
  /** Wind as a screen vector: east component (-1..1) scaled by strength (0..1). */
  windX: number
  windKph: number
  t: number
}

interface Layer {
  update(dt: number, env: Env): void
  draw(ctx: CanvasRenderingContext2D, env: Env, alpha: number, flash: number): void
  resize?(sx: number, sy: number): void
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const TAU = Math.PI * 2

/* ---------------------------------------------------------------- clouds */

type RGB = readonly [number, number, number]
const CLOUD_TONES: Record<string, { color: RGB; shade: number; alpha: number }> = {
  day: { color: [255, 255, 255], shade: 0.18, alpha: 0.85 },
  night: { color: [120, 135, 165], shade: 0.35, alpha: 0.55 },
  rain: { color: [165, 175, 192], shade: 0.4, alpha: 0.8 },
  rainNight: { color: [80, 90, 110], shade: 0.45, alpha: 0.75 },
  storm: { color: [95, 104, 122], shade: 0.55, alpha: 0.9 },
  snow: { color: [225, 232, 242], shade: 0.22, alpha: 0.8 },
  snowNight: { color: [130, 145, 172], shade: 0.35, alpha: 0.65 },
}

class Clouds implements Layer {
  items: { x: number; y: number; s: number; v: number; alpha: number; variant: number }[] = []
  constructor(
    env: Env,
    private tone: keyof typeof CLOUD_TONES,
    count: number,
    top: number,
    bottom: number,
    speedMul = 1,
  ) {
    const scaleBase = env.w < 640 ? 0.7 : 1
    const dir = env.windX < -0.05 ? -1 : 1
    const windMul = 1 + env.windKph / 22
    for (let i = 0; i < count; i++) {
      const depth = i / Math.max(1, count - 1) // 0 = far, 1 = near (drawn last)
      const s = (0.55 + depth * 1.1 + rand(-0.1, 0.15)) * scaleBase
      this.items.push({
        x: rand(-CLOUD_W * s * 0.5, env.w),
        y: rand(top, bottom) * env.h - CLOUD_H * s * 0.55,
        s,
        v: dir * (3 + depth * 16) * windMul * speedMul,
        alpha: 0.45 + depth * 0.55,
        variant: i % 4,
      })
    }
  }
  update(dt: number, env: Env) {
    for (const c of this.items) {
      c.x += c.v * dt
      const cw = CLOUD_W * c.s
      if (c.v > 0 && c.x > env.w + 20) c.x = -cw - rand(0, 120)
      if (c.v < 0 && c.x < -cw - 20) c.x = env.w + rand(0, 120)
    }
  }
  draw(ctx: CanvasRenderingContext2D, _env: Env, a: number, flash: number) {
    const tone = CLOUD_TONES[this.tone]
    for (const c of this.items) {
      const img = cloudSprite(tone.color, tone.shade, c.variant)
      ctx.globalAlpha = a * c.alpha * tone.alpha
      ctx.drawImage(img, c.x, c.y, CLOUD_W * c.s, CLOUD_H * c.s)
      if (flash > 0) {
        // Lightning lights the clouds from within.
        ctx.globalCompositeOperation = 'lighter'
        ctx.globalAlpha = a * c.alpha * flash * 0.7
        ctx.drawImage(cloudSprite([200, 210, 255], 0, c.variant), c.x, c.y, CLOUD_W * c.s, CLOUD_H * c.s)
        ctx.globalCompositeOperation = 'source-over'
      }
    }
  }
  resize(sx: number, sy: number) {
    for (const c of this.items) {
      c.x *= sx
      c.y *= sy
    }
  }
}

/* ------------------------------------------------------------------- sun */

class Sun implements Layer {
  constructor(private strength: number) {}
  update() {}
  draw(ctx: CanvasRenderingContext2D, env: Env, a: number) {
    const { w, h, t } = env
    const cx = w * (w < 640 ? 0.86 : 0.84)
    const cy = h * 0.05
    const R = Math.max(w, h) * 0.75
    const pulse = 1 + 0.035 * Math.sin(t * 0.6)
    const s = this.strength
    ctx.globalAlpha = a * s * 0.9
    const glow = glowSprite([255, 236, 190], [[0, 0.95], [0.08, 0.6], [0.3, 0.16], [1, 0]])
    ctx.drawImage(glow, cx - R * pulse, cy - R * pulse, R * 2 * pulse, R * 2 * pulse)

    // Two counter-rotating ray sprites = shimmering lens effect.
    const rays = raysSprite(18)
    const rs = R * 1.25
    for (const [speed, alpha] of [[0.025, 0.55], [-0.017, 0.35]] as const) {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(t * speed)
      ctx.globalAlpha = a * s * alpha * (0.75 + 0.25 * Math.sin(t * 0.8 + speed * 100))
      ctx.globalCompositeOperation = 'lighter'
      ctx.drawImage(rays, -rs, -rs, rs * 2, rs * 2)
      ctx.restore()
    }
    ctx.globalCompositeOperation = 'source-over'

    // Lens flare ghosts along the sun → centre axis.
    const tx = w * 0.3 - cx
    const ty = h * 0.62 - cy
    const ghosts: Array<[number, number, string]> = [
      [0.22, 14, '255,230,170'],
      [0.4, 34, '170,220,255'],
      [0.55, 8, '255,255,255'],
      [0.78, 58, '200,170,255'],
    ]
    ghosts.forEach(([k, r, col], i) => {
      const shimmer = 0.6 + 0.4 * Math.sin(t * 0.9 + i * 1.7)
      ctx.globalAlpha = a * s * 0.09 * shimmer
      ctx.fillStyle = `rgb(${col})`
      ctx.beginPath()
      ctx.arc(cx + tx * k, cy + ty * k, r * (w < 640 ? 0.7 : 1), 0, TAU)
      ctx.fill()
    })
  }
}

/* ----------------------------------------------------------------- stars */

class Stars implements Layer {
  stars: { x: number; y: number; r: number; ph: number; sp: number; base: number }[] = []
  shooting: { x: number; y: number; vx: number; vy: number; t: number; life: number } | null = null
  nextShoot = rand(2.5, 6)
  constructor(env: Env, private brightness: number, private moon: boolean) {
    const n = Math.round(220 * env.density)
    for (let i = 0; i < n; i++) {
      this.stars.push({
        x: Math.random() * env.w,
        y: Math.pow(Math.random(), 1.5) * env.h * 0.75,
        r: Math.random() < 0.08 ? rand(1.2, 1.8) : rand(0.4, 1.1),
        ph: rand(0, TAU),
        sp: rand(0.6, 2.2),
        base: rand(0.35, 0.95),
      })
    }
  }
  update(dt: number, env: Env) {
    for (const s of this.stars) s.ph += s.sp * dt
    this.nextShoot -= dt
    if (!this.shooting && this.nextShoot <= 0 && this.brightness > 0.5) {
      const dir = Math.random() < 0.5 ? -1 : 1
      const speed = rand(700, 1000)
      const ang = rand(0.3, 0.55)
      this.shooting = {
        x: rand(env.w * 0.15, env.w * 0.85),
        y: rand(env.h * 0.04, env.h * 0.3),
        vx: Math.cos(ang) * speed * dir,
        vy: Math.sin(ang) * speed,
        t: 0,
        life: rand(0.7, 1.1),
      }
      this.nextShoot = rand(6, 12)
    }
    if (this.shooting) {
      const s = this.shooting
      s.t += dt
      s.x += s.vx * dt
      s.y += s.vy * dt
      if (s.t >= s.life) this.shooting = null
    }
  }
  draw(ctx: CanvasRenderingContext2D, env: Env, a: number) {
    if (this.moon) {
      const R = Math.min(env.w, env.h) * 0.55
      const mx = env.w * 0.2
      const my = env.h * 0.08
      ctx.globalAlpha = a * 0.35
      ctx.drawImage(glowSprite([190, 205, 255], [[0, 0.7], [0.1, 0.3], [0.4, 0.08], [1, 0]]), mx - R, my - R, R * 2, R * 2)
    }
    ctx.fillStyle = '#fff'
    for (const s of this.stars) {
      const tw = 0.55 + 0.45 * Math.sin(s.ph)
      ctx.globalAlpha = a * this.brightness * s.base * tw
      if (s.r < 1) ctx.fillRect(s.x, s.y, s.r * 1.6, s.r * 1.6)
      else {
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, TAU)
        ctx.fill()
        if (tw > 0.92) {
          // Brief cross-shaped glint on the brightest stars.
          ctx.globalAlpha *= 0.5
          ctx.fillRect(s.x - s.r * 4, s.y - 0.4, s.r * 8, 0.8)
          ctx.fillRect(s.x - 0.4, s.y - s.r * 4, 0.8, s.r * 8)
        }
      }
    }
    const sh = this.shooting
    if (sh) {
      const fade = Math.sin((Math.PI * sh.t) / sh.life)
      const len = 0.16 // seconds of tail
      const x2 = sh.x - sh.vx * len
      const y2 = sh.y - sh.vy * len
      const g = ctx.createLinearGradient(sh.x, sh.y, x2, y2)
      g.addColorStop(0, 'rgba(255,255,255,1)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.globalAlpha = a * fade
      ctx.strokeStyle = g
      ctx.lineWidth = 1.6
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(sh.x, sh.y)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
  }
  resize(sx: number, sy: number) {
    for (const s of this.stars) {
      s.x *= sx
      s.y *= sy
    }
  }
}

/* ------------------------------------------------------------------ rain */

class Rain implements Layer {
  drops: { x: number; y: number; len: number; v: number; near: boolean }[] = []
  splashes: { x: number; y: number; t: number }[] = []
  slant: number
  constructor(env: Env, private intensity: number, private drizzle: boolean) {
    // Rain falls with the wind: horizontal speed as a fraction of vertical speed.
    this.slant = env.windX * 0.6 + 0.05
    const n = Math.round((drizzle ? 170 : 280) * (0.35 + intensity * 0.65) * env.density)
    for (let i = 0; i < n; i++) this.drops.push(this.spawn(env, Math.random() * env.h))
  }
  private spawn(env: Env, y: number) {
    const near = Math.random() < 0.35
    const v = (this.drizzle ? rand(380, 560) : rand(850, 1250)) * (near ? 1.15 : 0.8)
    const len = (this.drizzle ? rand(6, 11) : rand(14, 28)) * (near ? 1.3 : 0.8) * (0.7 + this.intensity * 0.4)
    const spread = this.slant * env.h
    return { x: rand(Math.min(0, -spread), env.w + Math.max(0, -spread)), y, len, v, near }
  }
  update(dt: number, env: Env) {
    for (let i = 0; i < this.drops.length; i++) {
      const d = this.drops[i]
      d.y += d.v * dt
      d.x += d.v * this.slant * dt
      if (d.y - d.len > env.h) {
        if (d.near && !this.drizzle && this.splashes.length < 40 && Math.random() < 0.5) {
          this.splashes.push({ x: d.x - this.slant * (d.y - env.h), y: env.h - rand(2, env.h * 0.1), t: 0 })
        }
        this.drops[i] = this.spawn(env, rand(-env.h * 0.15, 0))
      }
    }
    for (const s of this.splashes) s.t += dt
    this.splashes = this.splashes.filter((s) => s.t < 0.32)
  }
  draw(ctx: CanvasRenderingContext2D, _env: Env, a: number) {
    ctx.lineCap = 'round'
    ctx.strokeStyle = 'rgb(205,225,255)'
    for (const near of [false, true]) {
      ctx.globalAlpha = a * (this.drizzle ? (near ? 0.4 : 0.25) : near ? 0.5 : 0.28)
      ctx.lineWidth = near ? (this.drizzle ? 1.1 : 1.5) : 0.9
      ctx.beginPath()
      for (const d of this.drops) {
        if (d.near !== near) continue
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x - d.len * this.slant, d.y - d.len)
      }
      ctx.stroke()
    }
    ctx.lineWidth = 1
    for (const s of this.splashes) {
      const k = s.t / 0.32
      ctx.globalAlpha = a * 0.5 * (1 - k)
      ctx.beginPath()
      ctx.ellipse(s.x, s.y, 2 + k * 9, 0.8 + k * 2.6, 0, Math.PI, TAU)
      ctx.stroke()
    }
  }
  resize(sx: number, sy: number) {
    for (const d of this.drops) {
      d.x *= sx
      d.y *= sy
    }
    this.splashes = []
  }
}

/** Water beads landing on the "glass" and slowly sliding, like iOS Weather in the rain. */
class GlassDrops implements Layer {
  beads: { x: number; y: number; r: number; t: number; life: number; slide: number }[] = []
  acc = 0
  constructor(env: Env, private rate: number) {
    const cap = this.cap(env)
    for (let i = 0; i < cap * 0.6; i++) {
      const b = this.make(env)
      b.t = rand(0.2, b.life * 0.7)
      this.beads.push(b)
    }
  }
  private cap(env: Env) {
    return Math.round(18 * env.density)
  }
  private make(env: Env) {
    const r = rand(2, 6.5)
    return { x: rand(0, env.w), y: rand(0, env.h), r, t: 0, life: rand(3, 8), slide: Math.random() < 0.35 ? rand(8, 26) * (r / 5) : 0 }
  }
  update(dt: number, env: Env) {
    this.acc += dt * this.rate
    while (this.acc > 1) {
      this.acc -= 1
      if (this.beads.length < this.cap(env)) this.beads.push(this.make(env))
    }
    for (const b of this.beads) {
      b.t += dt
      b.y += b.slide * dt
    }
    this.beads = this.beads.filter((b) => b.t < b.life)
  }
  draw(ctx: CanvasRenderingContext2D, _env: Env, a: number) {
    const img = beadSprite()
    for (const b of this.beads) {
      ctx.globalAlpha = a * Math.min(1, b.t / 0.12) * Math.min(1, (b.life - b.t) / 0.8) * 0.9
      ctx.drawImage(img, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2.15)
    }
  }
  resize(sx: number, sy: number) {
    for (const b of this.beads) {
      b.x *= sx
      b.y *= sy
    }
  }
}

/* ------------------------------------------------------------------ snow */

class Snow implements Layer {
  flakes: { x: number; y: number; r: number; v: number; amp: number; ph: number; ps: number; depth: number }[] = []
  constructor(env: Env, intensity: number) {
    const n = Math.round(230 * (0.4 + intensity * 0.6) * env.density)
    for (let i = 0; i < n; i++) {
      const depth = Math.random()
      this.flakes.push({
        x: Math.random() * env.w,
        y: Math.random() * env.h,
        r: 0.8 + Math.pow(depth, 1.6) * 3.8,
        v: 22 + depth * 70,
        amp: 10 + depth * 26,
        ph: rand(0, TAU),
        ps: rand(0.5, 1.3),
        depth,
      })
    }
  }
  update(dt: number, env: Env) {
    const drift = env.windX * 90 + 6
    for (const f of this.flakes) {
      f.ph += f.ps * dt
      f.y += f.v * dt
      // Derivative of amp*sin(ph) → smooth sway.
      f.x += (drift * (0.4 + f.depth) + Math.cos(f.ph) * f.amp * f.ps) * dt
      if (f.y - f.r > env.h) {
        f.y = -f.r - rand(0, 30)
        f.x = Math.random() * env.w
      }
      if (f.x > env.w + 10) f.x = -10
      else if (f.x < -10) f.x = env.w + 10
    }
  }
  draw(ctx: CanvasRenderingContext2D, _env: Env, a: number) {
    // Far flakes: one batched path. Near flakes: soft sprite.
    ctx.fillStyle = '#fff'
    ctx.globalAlpha = a * 0.75
    ctx.beginPath()
    for (const f of this.flakes) {
      if (f.r >= 1.9) continue
      ctx.moveTo(f.x + f.r, f.y)
      ctx.arc(f.x, f.y, f.r, 0, TAU)
    }
    ctx.fill()
    const img = flakeSprite()
    ctx.globalAlpha = a * 0.95
    for (const f of this.flakes) {
      if (f.r < 1.9) continue
      const s = f.r * 2.6
      ctx.drawImage(img, f.x - s / 2, f.y - s / 2, s, s)
    }
  }
  resize(sx: number, sy: number) {
    for (const f of this.flakes) {
      f.x *= sx
      f.y *= sy
    }
  }
}

/* ------------------------------------------------------------------- fog */

class Fog implements Layer {
  bands: { y: number; x: number; v: number; alpha: number; scale: number; variant: number; ph: number }[] = []
  constructor(env: Env, private front: boolean) {
    const dir = env.windX < -0.05 ? -1 : 1
    const rows = front ? [0.78] : [0.12, 0.32, 0.52, 0.7]
    rows.forEach((y, i) => {
      this.bands.push({
        y,
        x: Math.random() * MIST_W,
        v: dir * (6 + i * 5 + env.windKph * 0.4) * (front ? 2 : 1),
        alpha: front ? 0.4 : 0.35 + i * 0.08,
        scale: front ? 1.6 : 1 + i * 0.2,
        variant: i + (front ? 10 : 0),
        ph: rand(0, TAU),
      })
    })
  }
  update(dt: number) {
    for (const b of this.bands) {
      b.x += b.v * dt
      b.ph += dt * 0.25
    }
  }
  draw(ctx: CanvasRenderingContext2D, env: Env, a: number) {
    for (const b of this.bands) {
      const img = mistSprite(b.variant)
      const sw = Math.max(env.w, 600) * 1.4 * b.scale
      const sh = (MIST_H / MIST_W) * sw * 0.9
      const y = b.y * env.h - sh / 2
      let x = ((b.x % sw) + sw) % sw - sw
      ctx.globalAlpha = a * b.alpha * (0.85 + 0.15 * Math.sin(b.ph))
      for (; x < env.w; x += sw) ctx.drawImage(img, x, y, sw, sh)
    }
    if (!this.front) {
      const g = ctx.createLinearGradient(0, env.h * 0.35, 0, env.h)
      g.addColorStop(0, 'rgba(225,230,238,0)')
      g.addColorStop(1, 'rgba(225,230,238,0.22)')
      ctx.globalAlpha = a
      ctx.fillStyle = g
      ctx.fillRect(0, env.h * 0.35, env.w, env.h * 0.65)
    }
  }
}

/* ------------------------------------------------------------------ wind */

class WindStreaks implements Layer {
  streaks: { x: number; y: number; len: number; amp: number; t: number; life: number; v: number }[] = []
  dir: number
  constructor(env: Env) {
    this.dir = env.windX < -0.02 ? -1 : 1
    const n = Math.round(Math.min(14, Math.max(4, (env.windKph - 14) / 3)) * Math.max(0.6, env.density))
    for (let i = 0; i < n; i++) {
      const s = this.make(env)
      s.t = rand(0, s.life)
      this.streaks.push(s)
    }
  }
  private make(env: Env) {
    return {
      x: rand(-env.w * 0.2, env.w),
      y: rand(env.h * 0.05, env.h * 0.9),
      len: rand(90, 240),
      amp: rand(-14, 14),
      t: 0,
      life: rand(1.2, 2.4),
      v: (260 + env.windKph * 9) * rand(0.8, 1.2),
    }
  }
  update(dt: number, env: Env) {
    for (let i = 0; i < this.streaks.length; i++) {
      const s = this.streaks[i]
      s.t += dt
      s.x += s.v * this.dir * dt
      if (s.t > s.life) this.streaks[i] = this.make(env)
    }
  }
  draw(ctx: CanvasRenderingContext2D, _env: Env, a: number) {
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.2
    ctx.lineCap = 'round'
    for (const s of this.streaks) {
      ctx.globalAlpha = a * 0.22 * Math.sin((Math.PI * s.t) / s.life)
      const tail = s.x - s.len * this.dir
      ctx.beginPath()
      ctx.moveTo(s.x, s.y)
      ctx.bezierCurveTo(s.x - s.len * 0.35 * this.dir, s.y - s.amp, tail + s.len * 0.3 * this.dir, s.y + s.amp, tail, s.y)
      ctx.stroke()
    }
  }
  resize(sx: number, sy: number) {
    for (const s of this.streaks) {
      s.x *= sx
      s.y *= sy
    }
  }
}

/* ------------------------------------------------------------- lightning */

class Lightning {
  t = 99
  pulses: Array<[number, number]> = []
  bolt: Array<[number, number]>[] = []
  next = rand(1.5, 4)
  held = false
  trigger(env: Env, forceBolt = false) {
    this.t = 0
    const n = 1 + Math.floor(Math.random() * 3)
    this.pulses = [[0, 1]]
    for (let i = 1; i < n; i++) this.pulses.push([i * rand(0.09, 0.16), rand(0.45, 0.9)])
    this.bolt = forceBolt || Math.random() < 0.6 ? makeBolt(env) : []
    this.next = rand(3, 8)
  }
  update(dt: number, env: Env) {
    if (this.held) return
    this.t += dt
    this.next -= dt
    if (this.next <= 0) this.trigger(env)
  }
  value() {
    if (this.held) return 0.95
    let f = 0
    for (const [at, peak] of this.pulses) if (this.t >= at) f = Math.max(f, peak * Math.exp(-(this.t - at) / 0.075))
    return f < 0.01 ? 0 : f
  }
}

function makeBolt(env: Env) {
  const paths: Array<[number, number]>[] = []
  const x0 = rand(env.w * 0.2, env.w * 0.8)
  const y0 = env.h * rand(0.08, 0.16)
  const yEnd = env.h * rand(0.5, 0.8)
  const main: Array<[number, number]> = [[x0, y0]]
  const segs = 14
  let x = x0
  for (let i = 1; i <= segs; i++) {
    x += rand(-1, 1) * env.w * 0.035
    main.push([x, y0 + ((yEnd - y0) * i) / segs])
  }
  paths.push(main)
  for (let b = 0; b < 2; b++) {
    const start = main[3 + Math.floor(Math.random() * 6)]
    const branch: Array<[number, number]> = [start]
    let [bx, by] = start
    const dir = Math.random() < 0.5 ? -1 : 1
    for (let i = 0; i < 5; i++) {
      bx += dir * rand(6, 22)
      by += rand(10, 26)
      branch.push([bx, by])
    }
    paths.push(branch)
  }
  return paths
}

/* ----------------------------------------------------------------- scene */

class Scene {
  back: Layer[] = []
  clouds: Clouds | null = null
  front: Layer[] = []
  lightning: Lightning | null = null
  constructor(
    public spec: SceneSpec,
    env: Env,
  ) {
    const { kind, period, intensity } = spec
    const night = period !== 'day'
    const twilight = period === 'twilight'
    const windy = env.windKph >= 22
    const tone = (base: 'rain' | 'snow'): keyof typeof CLOUD_TONES => (night ? (`${base}Night` as const) : base)

    switch (kind) {
      case 'clear':
        if (night) this.back.push(new Stars(env, twilight ? 0.45 : 1, !twilight))
        else this.back.push(new Sun(1))
        break
      case 'partly':
        if (night) this.back.push(new Stars(env, twilight ? 0.35 : 0.75, false))
        else this.back.push(new Sun(0.75))
        this.clouds = new Clouds(env, night ? 'night' : 'day', env.w < 640 ? 4 : 6, 0.08, 0.42)
        break
      case 'cloudy':
        this.clouds = new Clouds(env, night ? 'night' : 'day', env.w < 640 ? 8 : 11, 0.02, 0.62)
        break
      case 'fog':
        this.clouds = new Clouds(env, night ? 'night' : 'day', 3, 0.02, 0.2, 0.6)
        this.back.push(new Fog(env, false))
        this.front.push(new Fog(env, true))
        break
      case 'drizzle':
      case 'rain':
        this.clouds = new Clouds(env, tone('rain'), env.w < 640 ? 7 : 10, 0.0, 0.4)
        this.front.push(new Rain(env, intensity, kind === 'drizzle'))
        this.front.push(new GlassDrops(env, kind === 'drizzle' ? 1 : 1 + intensity * 2))
        break
      case 'storm':
        this.lightning = new Lightning()
        this.clouds = new Clouds(env, 'storm', env.w < 640 ? 8 : 11, 0.0, 0.45, 1.4)
        this.front.push(new Rain(env, Math.max(0.8, intensity), false))
        this.front.push(new GlassDrops(env, 3))
        break
      case 'snow':
        this.clouds = new Clouds(env, tone('snow'), env.w < 640 ? 6 : 8, 0.0, 0.38)
        this.front.push(new Snow(env, intensity))
        break
    }
    if (windy && (kind === 'clear' || kind === 'partly' || kind === 'cloudy' || kind === 'fog')) this.front.push(new WindStreaks(env))
  }
  layers(): Layer[] {
    return [...this.back, ...(this.clouds ? [this.clouds] : []), ...this.front]
  }
  update(dt: number, env: Env) {
    for (const l of this.layers()) l.update(dt, env)
    this.lightning?.update(dt, env)
  }
  draw(ctx: CanvasRenderingContext2D, env: Env, a: number) {
    const flash = this.lightning?.value() ?? 0
    if (flash > 0) {
      ctx.globalAlpha = a * flash * 0.3
      ctx.fillStyle = 'rgb(205,215,255)'
      ctx.fillRect(0, 0, env.w, env.h)
    }
    for (const l of this.back) l.draw(ctx, env, a, flash)
    this.clouds?.draw(ctx, env, a, flash)
    if (flash > 0.12 && this.lightning?.bolt.length) drawBolt(ctx, this.lightning.bolt, a * Math.min(1, flash * 1.3))
    for (const l of this.front) l.draw(ctx, env, a, flash)
  }
  resize(sx: number, sy: number) {
    for (const l of this.layers()) l.resize?.(sx, sy)
    if (this.lightning) this.lightning.bolt = this.lightning.bolt.map((p) => p.map(([x, y]) => [x * sx, y * sy] as [number, number]))
  }
}

function drawBolt(ctx: CanvasRenderingContext2D, paths: Array<[number, number]>[], a: number) {
  ctx.save()
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.shadowColor = 'rgba(170,190,255,1)'
  ctx.shadowBlur = 18
  paths.forEach((p, i) => {
    ctx.globalAlpha = a * (i === 0 ? 1 : 0.6)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = i === 0 ? 2.4 : 1.2
    ctx.beginPath()
    p.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.stroke()
  })
  ctx.restore()
}

export function sceneId(s: SceneSpec) {
  return [s.kind, s.period, Math.round(s.intensity * 4), Math.round(s.windKph / 8), Math.round(s.windDirDeg / 45) % 8].join(':')
}

/* ---------------------------------------------------------------- engine */

const FADE_S = 1.1
const MAX_DPR = 1.5

/**
 * A single full-screen canvas driven by one requestAnimationFrame loop. Scenes
 * crossfade when the conditions change; the loop pauses in hidden tabs; under
 * reduced motion it paints one static frame and stops.
 */
export class SkyEngine {
  private ctx: CanvasRenderingContext2D
  private scenes: { scene: Scene; a: number; target: number }[] = []
  private env: Env = { w: 0, h: 0, density: 1, windX: 0, windKph: 0, t: 0 }
  private raf = 0
  private last = 0
  private wantRun = false
  private reduced = false
  frames = 0

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d', { alpha: true })!
    this.measure()
    window.addEventListener('resize', this.onResize)
    document.addEventListener('visibilitychange', this.onVisibility)
  }

  get running() {
    return this.raf !== 0
  }
  get scene() {
    const top = this.scenes[this.scenes.length - 1]
    return top ? `${top.scene.spec.kind}-${top.scene.spec.period}` : null
  }

  setReduced(r: boolean) {
    this.reduced = r
    this.canvas.dataset.motion = r ? 'static' : 'animated'
    if (r) {
      this.halt()
      // Collapse any crossfade and paint a still frame.
      this.scenes = this.scenes.slice(-1).map((s) => ({ ...s, a: 1, target: 1 }))
      this.renderStatic()
    } else if (this.wantRun) this.resume()
  }

  setScene(spec: SceneSpec) {
    const top = this.scenes[this.scenes.length - 1]
    if (top && sceneId(top.scene.spec) === sceneId(spec)) return
    this.applyWind(spec)
    const scene = new Scene(spec, this.env)
    if (this.reduced || !top) {
      this.scenes = [{ scene, a: 1, target: 1 }]
      if (this.reduced || !this.running) this.renderStatic()
      return
    }
    for (const s of this.scenes) s.target = 0
    this.scenes.push({ scene, a: 0, target: 1 })
    if (this.scenes.length > 3) this.scenes.splice(0, this.scenes.length - 3)
  }

  start() {
    this.wantRun = true
    if (!this.reduced) this.resume()
  }

  /** Test/screenshot hook: trigger a lightning strike now (optionally freeze it at its peak). */
  flash(hold = false) {
    const top = this.scenes[this.scenes.length - 1]?.scene
    if (!top?.lightning) return false
    top.lightning.trigger(this.env, true)
    top.lightning.held = hold
    if (this.reduced || !this.running) this.renderStatic()
    return true
  }
  release() {
    for (const s of this.scenes) if (s.scene.lightning) s.scene.lightning.held = false
  }

  destroy() {
    this.halt()
    this.wantRun = false
    window.removeEventListener('resize', this.onResize)
    document.removeEventListener('visibilitychange', this.onVisibility)
  }

  private applyWind(spec: SceneSpec) {
    // Direction is where the wind comes FROM; it blows toward dir+180°.
    const east = -Math.sin((spec.windDirDeg * Math.PI) / 180)
    const strength = Math.min(1, spec.windKph / 55)
    this.env.windX = east * strength
    this.env.windKph = spec.windKph
  }

  private measure() {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.canvas.width = Math.round(w * dpr)
    this.canvas.height = Math.round(h * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const old = { w: this.env.w, h: this.env.h }
    this.env.w = w
    this.env.h = h
    this.env.density = w < 640 ? 0.55 : w < 1024 ? 0.8 : 1
    return old
  }

  private onResize = () => {
    const old = this.measure()
    if (old.w && old.h) for (const s of this.scenes) s.scene.resize(this.env.w / old.w, this.env.h / old.h)
    if (!this.running) this.renderStatic()
  }

  private onVisibility = () => {
    if (document.hidden) this.halt()
    else if (this.wantRun && !this.reduced) this.resume()
  }

  private resume() {
    if (this.raf || document.hidden) return
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.loop)
  }

  private halt() {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  private loop = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    this.env.t += dt
    for (const s of this.scenes) {
      s.a = s.target > s.a ? Math.min(1, s.a + dt / FADE_S) : Math.max(0, s.a - dt / FADE_S)
      s.scene.update(dt, this.env)
    }
    this.scenes = this.scenes.filter((s) => s.a > 0 || s.target > 0)
    this.paint()
    this.raf = requestAnimationFrame(this.loop)
  }

  private renderStatic() {
    this.env.t = 2
    this.paint()
  }

  private paint() {
    const { ctx } = this
    ctx.globalAlpha = 1
    ctx.clearRect(0, 0, this.env.w, this.env.h)
    for (const s of this.scenes) if (s.a > 0) s.scene.draw(ctx, this.env, s.a)
    ctx.globalAlpha = 1
    this.frames++
  }
}
