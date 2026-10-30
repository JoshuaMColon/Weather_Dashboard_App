import { useSyncExternalStore } from 'react'
import type { SkyState } from './sky'

/**
 * The sky is rendered once at the app root so it survives city switches and can
 * crossfade between scenes; the visible WeatherView publishes what it shows here.
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
