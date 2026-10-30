/** Moon phase from a known new moon (2000-01-06 18:14 UTC); accurate to well under a day. */
const SYNODIC = 29.530588853
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) / 1000

export interface MoonPhase {
  /** 0 = new, 0.5 = full. */
  phase: number
  illumination: number
  name: string
  daysToFull: number
}

export function moonPhase(unix: number): MoonPhase {
  const days = (unix - KNOWN_NEW_MOON) / 86400
  const phase = (((days / SYNODIC) % 1) + 1) % 1
  const illumination = Math.round(((1 - Math.cos(2 * Math.PI * phase)) / 2) * 100)
  const names = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent']
  const name = names[Math.round(phase * 8) % 8]
  const daysToFull = Math.round(((0.5 - phase + 1) % 1) * SYNODIC)
  return { phase, illumination, name, daysToFull }
}
