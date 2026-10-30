import { useEffect, useState } from 'react'

export const easeOutCubic = (k: number) => 1 - Math.pow(1 - k, 3)
/** Overshoots slightly and settles, like a needle. */
export const easeOutBack = (k: number) => {
  const c1 = 1.4
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2)
}

interface Opts {
  from: number
  duration?: number
  /** false → jump straight to the target (reduced motion). */
  enabled?: boolean
  /** Wait until true (e.g. scrolled into view) before animating. */
  active?: boolean
  ease?: (k: number) => number
}

/**
 * Animates once from `from` to `target` on mount. Later target changes (e.g.
 * switching °F/°C) jump immediately so the value is never stale.
 */
export function useTween(target: number, { from, duration = 900, enabled = true, active = true, ease = easeOutCubic }: Opts): number {
  const [st, setSt] = useState(() => ({ target, value: enabled ? from : target, done: !enabled }))
  let cur = st
  if (st.target !== target) {
    cur = { target, value: target, done: true }
    setSt(cur)
  }
  const done = cur.done
  useEffect(() => {
    if (done || !active) return
    let raf = 0
    let t0 = 0
    const step = (now: number) => {
      if (!t0) t0 = now
      const k = Math.min(1, (now - t0) / duration)
      setSt((p) => (p.done ? p : { ...p, value: from + (p.target - from) * ease(k), done: k >= 1 }))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [done, active, from, duration, ease])
  return cur.value
}
