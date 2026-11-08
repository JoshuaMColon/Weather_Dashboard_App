import { useSyncExternalStore } from 'react'
import type { SkyState } from './sky'

/**
 * One canvas lives on the app root so it can crossfade when the city changes.
 * WeatherView publishes the scene; the canvas subscribes. I keep this outside
 * React state so a new forecast doesn't remount the canvas and restart every particle.
 */
export interface SkyScene {
  sky: SkyState
  gradient: string
  intensity: number
  windKph: number
  windDirDeg: number
}

let current: SkyScene | null = null
const subs = new Set<() => void>()

const same = (a: SkyScene | null, b: SkyScene) =>
  !!a && a.sky.key === b.sky.key && a.gradient === b.gradient && a.intensity === b.intensity && a.windKph === b.windKph && a.windDirDeg === b.windDirDeg

export const skyStore = {
  get: () => current,
  set(next: SkyScene, { onlyIfEmpty = false } = {}) {
    // A loading city publishes a fallback only when nothing is up yet, so the
    // previous city's sky stays put instead of flashing the placeholder.
    if (onlyIfEmpty && current) return
    if (same(current, next)) return
    current = next
    subs.forEach((f) => f())
  },
  subscribe(f: () => void) {
    subs.add(f)
    return () => {
      subs.delete(f)
    }
  },
}

export const useSkyScene = () => useSyncExternalStore(skyStore.subscribe, skyStore.get, () => null)
