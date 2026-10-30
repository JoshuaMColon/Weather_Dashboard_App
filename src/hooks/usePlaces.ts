import { useCallback, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, TABLES } from '../lib/supabase'
import { load, save } from '../lib/storage'
import { round4, SAMPLE_PLACES, samePlace, type Place } from '../lib/places'

const LOCAL_KEY = 'wx:places'
type SyncState = 'local' | 'syncing' | 'synced' | 'error'

interface Row {
  id: string
  name: string
  lat: number
  lon: number
  country: string | null
  admin1: string | null
  sort_order: number
}

const fromRow = (r: Row): Place => ({ id: r.id, name: r.name, lat: r.lat, lon: r.lon, country: r.country, admin1: r.admin1, sortOrder: r.sort_order })
const localId = () => `local-${Math.random().toString(36).slice(2, 10)}`

function loadLocal(): Place[] {
  const stored = load<Place[] | null>(LOCAL_KEY, null)
  if (stored) return stored
  // First visit: start with a few sample cities so the app never opens empty.
  return SAMPLE_PLACES.slice(0, 3).map((p, i) => ({ ...p, id: localId(), sortOrder: i }))
}

export function usePlaces(user: User | null) {
  const uid = user?.id ?? null
  const [places, setPlaces] = useState<Place[]>(() => (uid ? load<Place[]>(`${LOCAL_KEY}:cache:${uid}`, []) : loadLocal()))
  const [sync, setSync] = useState<SyncState>(uid ? 'syncing' : 'local')
  const placesRef = useRef(places)
  useEffect(() => {
    placesRef.current = places
  }, [places])

  // Reset synchronously when the signed-in user changes (derived state pattern).
  const [prevUid, setPrevUid] = useState(uid)
  if (prevUid !== uid) {
    setPrevUid(uid)
    setPlaces(uid ? load<Place[]>(`${LOCAL_KEY}:cache:${uid}`, []) : loadLocal())
    setSync(uid && supabase ? 'syncing' : 'local')
  }

  const fetchRemote = useCallback(async () => {
    if (!supabase || !uid) return
    const { data, error } = await supabase
      .from(TABLES.locations)
      .select('id, name, lat, lon, country, admin1, sort_order')
      .order('sort_order')
      .order('created_at')
      .returns<Row[]>()
    if (error) return setSync('error')
    setPlaces(data.map(fromRow))
    save(`${LOCAL_KEY}:cache:${uid}`, data.map(fromRow))
    setSync('synced')
  }, [uid])

  // Signed in: merge device cities into the account, then load and subscribe for live changes.
  useEffect(() => {
    if (!supabase || !uid) return
    const client = supabase
    let alive = true
    ;(async () => {
      const pending = load<Place[] | null>(LOCAL_KEY, null) ?? []
      if (sessionStorage.getItem('wx:demo') === '1') {
        sessionStorage.removeItem('wx:demo')
        SAMPLE_PLACES.forEach((s) => {
          if (!pending.some((p) => samePlace(p, s))) pending.push({ ...s, id: localId(), sortOrder: pending.length })
        })
      }
      if (pending.length) {
        const { error } = await client.from(TABLES.locations).upsert(
          pending.map((p, i) => ({ name: p.name, lat: round4(p.lat), lon: round4(p.lon), country: p.country, admin1: p.admin1, sort_order: i })),
          { onConflict: 'user_id,lat,lon', ignoreDuplicates: true },
        )
        // Merged: the account is now the source of truth for these cities.
        if (!error) save(LOCAL_KEY, [])
      }
      if (alive) await fetchRemote()
    })()

    let timer: number | undefined
    const channel = client
      .channel(`wx-places-${uid}`)
      .on('postgres_changes', { event: '*', schema: 'weather', table: 'saved_locations', filter: `user_id=eq.${uid}` }, () => {
        window.clearTimeout(timer)
        timer = window.setTimeout(() => void fetchRemote(), 150)
      })
      .subscribe()
    return () => {
      alive = false
      window.clearTimeout(timer)
      void client.removeChannel(channel)
      // Signing out keeps a copy of the account's cities on this device.
      if (placesRef.current.length && !(load<Place[] | null>(LOCAL_KEY, null) ?? []).length) save(LOCAL_KEY, placesRef.current)
    }
  }, [uid, fetchRemote])

  const persistLocal = (next: Place[]) => {
    placesRef.current = next
    setPlaces(next)
    if (!uid) save(LOCAL_KEY, next)
  }

  const add = useCallback(
    async (p: Omit<Place, 'id' | 'sortOrder'>) => {
      const current = placesRef.current
      if (current.some((x) => samePlace(x, p))) return
      const sortOrder = current.reduce((m, x) => Math.max(m, x.sortOrder), -1) + 1
      const optimistic: Place = { ...p, lat: round4(p.lat), lon: round4(p.lon), id: localId(), sortOrder }
      persistLocal([...current, optimistic])
      if (supabase && uid) {
        const { error } = await supabase.from(TABLES.locations).upsert(
          { name: p.name, lat: optimistic.lat, lon: optimistic.lon, country: p.country, admin1: p.admin1, sort_order: sortOrder },
          { onConflict: 'user_id,lat,lon', ignoreDuplicates: true },
        )
        if (error) setSync('error')
        await fetchRemote()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, fetchRemote],
  )

  const remove = useCallback(
    async (id: string) => {
      persistLocal(placesRef.current.filter((p) => p.id !== id))
      if (supabase && uid && !id.startsWith('local-')) {
        const { error } = await supabase.from(TABLES.locations).delete().eq('id', id)
        if (error) setSync('error')
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid],
  )

  const move = useCallback(
    async (id: string, dir: -1 | 1) => {
      const list = [...placesRef.current]
      const i = list.findIndex((p) => p.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= list.length) return
      ;[list[i], list[j]] = [list[j], list[i]]
      const next = list.map((p, k) => ({ ...p, sortOrder: k }))
      persistLocal(next)
      if (supabase && uid) {
        await Promise.all(
          [next[i], next[j]].filter((p) => !p.id.startsWith('local-')).map((p) => supabase!.from(TABLES.locations).update({ sort_order: p.sortOrder }).eq('id', p.id)),
        )
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid],
  )

  return { places, sync, add, remove, move }
}
