import { useCallback, useEffect, useState } from 'react'
import { getWeather, type WeatherResponse } from '../lib/api'
import { load, save } from '../lib/storage'

/**
 * Per-city weather, layered so the forecast paints immediately and the city
 * list doesn't stampede the API:
 *   memory       — this tab, instant
 *   localStorage — last 6 hours, so a reload still has something to show
 *   inflight     — one shared promise per coordinate
 * Fresh means under 10 minutes. Older than that, I show the cache and refetch.
 * Failures are not cached: the shared promise rejects, the key is dropped, and
 * the next attempt tries again. The key is 2 decimals, matching the CDN key.
 */
const TEN_MIN = 10 * 60 * 1000
const memory = new Map<string, { data: WeatherResponse; at: number }>()
const inflight = new Map<string, Promise<WeatherResponse>>()
const keyOf = (lat: number, lon: number) => `${lat.toFixed(2)},${lon.toFixed(2)}`

function cached(key: string) {
  const hit = memory.get(key)
  if (hit) return hit
  const stored = load<{ data: WeatherResponse; at: number } | null>(`wx:w:${key}`, null)
  // Six hours is "still worth showing", not "still fresh". The caller refetches.
  if (stored && Date.now() - stored.at < 6 * 3600 * 1000) {
    memory.set(key, stored)
    return stored
  }
  return null
}

async function fetchShared(lat: number, lon: number, key: string) {
  // The open city and every mini card in the list ask for the same coordinates.
  // One promise serves all of them.
  let p = inflight.get(key)
  if (!p) {
    p = getWeather(lat, lon).finally(() => inflight.delete(key))
    inflight.set(key, p)
  }
  const data = await p
  const entry = { data, at: Date.now() }
  memory.set(key, entry)
  save(`wx:w:${key}`, entry)
  return data
}

const isFresh = (key: string) => {
  const hit = cached(key)
  return !!hit && Date.now() - hit.at < TEN_MIN
}

export interface WeatherState {
  data: WeatherResponse | null
  error: string | null
  loading: boolean
  refresh: () => void
}

export function useWeather(lat: number | null, lon: number | null): WeatherState {
  const key = lat === null || lon === null ? null : keyOf(lat, lon)
  const [state, setState] = useState<{ key: string | null; data: WeatherResponse | null; error: string | null; loading: boolean }>(() => ({
    key,
    data: key ? (cached(key)?.data ?? null) : null,
    error: null,
    loading: !!key && !isFresh(key),
  }))
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])

  // Derived state, not an effect. Switching cities has to drop the previous
  // payload in the same render, or the old temperature flashes under the new name.
  if (state.key !== key) {
    setState({ key, data: key ? (cached(key)?.data ?? null) : null, error: null, loading: !!key && !isFresh(key) })
  }

  useEffect(() => {
    if (key === null || lat === null || lon === null) return
    let alive = true
    // tick === 0 and fresh: the reset above already painted the cache.
    // Skip the network until refresh() or the 10-minute timer bumps tick.
    if (!(tick === 0 && isFresh(key))) {
      fetchShared(lat, lon, key)
        .then((data) => alive && setState({ key, data, error: null, loading: false }))
        // Keep whatever is already on screen. The error only replaces a city
        // that never loaded (data stays null).
        .catch((err: Error) => alive && setState((s) => ({ ...s, error: err.message || 'Could not load weather', loading: false })))
    }
    const timer = window.setInterval(() => setTick((t) => t + 1), TEN_MIN)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [key, lat, lon, tick])

  // A background refetch shouldn't blank a city the user can already read.
  return { data: state.data, error: state.error, loading: state.loading && !state.data, refresh }
}
