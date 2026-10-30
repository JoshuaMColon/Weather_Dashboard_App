import { useCallback, useEffect, useState } from 'react'
import { getWeather, type WeatherResponse } from '../lib/api'
import { load, save } from '../lib/storage'

const TEN_MIN = 10 * 60 * 1000
const memory = new Map<string, { data: WeatherResponse; at: number }>()
const inflight = new Map<string, Promise<WeatherResponse>>()
const keyOf = (lat: number, lon: number) => `${lat.toFixed(2)},${lon.toFixed(2)}`

function cached(key: string) {
  const hit = memory.get(key)
  if (hit) return hit
  const stored = load<{ data: WeatherResponse; at: number } | null>(`wx:w:${key}`, null)
  // Only reuse localStorage copies from the last 6 hours (shown instantly, then refreshed).
  if (stored && Date.now() - stored.at < 6 * 3600 * 1000) {
    memory.set(key, stored)
    return stored
  }
  return null
}

async function fetchShared(lat: number, lon: number, key: string) {
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

  // Reset synchronously when the location changes (derived state pattern).
  if (state.key !== key) {
    setState({ key, data: key ? (cached(key)?.data ?? null) : null, error: null, loading: !!key && !isFresh(key) })
  }

  useEffect(() => {
    if (key === null || lat === null || lon === null) return
    let alive = true
    // A fresh cached entry was already applied by the derived-state reset above.
    if (!(tick === 0 && isFresh(key))) {
      fetchShared(lat, lon, key)
        .then((data) => alive && setState({ key, data, error: null, loading: false }))
        .catch((err: Error) => alive && setState((s) => ({ ...s, error: err.message || 'Could not load weather', loading: false })))
    }
    const timer = window.setInterval(() => setTick((t) => t + 1), TEN_MIN)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [key, lat, lon, tick])

  return { data: state.data, error: state.error, loading: state.loading && !state.data, refresh }
}
