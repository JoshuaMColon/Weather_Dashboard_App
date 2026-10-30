import { useCallback, useEffect, useState } from 'react'
import { reverseGeocode } from '../lib/api'
import { load, save } from '../lib/storage'
import type { Place } from '../lib/places'

export function useGeolocation() {
  const [here, setHere] = useState<Place | null>(() => load<Place | null>('wx:here', null))
  const [status, setStatus] = useState<'idle' | 'locating' | 'denied' | 'error'>('idle')

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) return setStatus('error')
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const place = await reverseGeocode(coords.latitude, coords.longitude)
        const next: Place = { id: 'here', name: place.name, lat: coords.latitude, lon: coords.longitude, admin1: place.admin1, country: place.country, sortOrder: -1 }
        setHere(next)
        save('wx:here', next)
        setStatus('idle')
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 15 * 60 * 1000 },
    )
  }, [])

  // Refresh quietly on load if permission was granted before.
  useEffect(() => {
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((p) => {
        if (p.state === 'granted') locate()
      })
      .catch(() => {})
  }, [locate])

  return { here, status, locate }
}
