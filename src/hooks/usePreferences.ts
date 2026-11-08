import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, TABLES } from '../lib/supabase'
import { load, save } from '../lib/storage'
import { DEFAULT_PREFS, type Preferences } from '../lib/units'

interface Row {
  units: Preferences['units']
  wind_unit: Preferences['windUnit']
  theme: Preferences['theme']
}

/**
 * Units and theme. localStorage applies immediately, including before auth
 * resolves, so a toggle never waits on the network. Once there's a user I
 * read their row. No row yet means first sign-in: I push the device choices
 * up so the account doesn't snap back to °F.
 */
export function usePreferences(user: User | null) {
  const [prefs, setPrefs] = useState<Preferences>(() => ({ ...DEFAULT_PREFS, ...load<Partial<Preferences>>('wx:prefs', {}) }))
  const uid = user?.id ?? null

  useEffect(() => {
    if (!supabase || !uid) return
    let alive = true
    supabase
      .from(TABLES.prefs)
      .select('units, wind_unit, theme')
      .maybeSingle<Row>()
      .then(async ({ data, error }) => {
        if (!alive || error) return
        if (data) {
          const next = { units: data.units, windUnit: data.wind_unit, theme: data.theme }
          setPrefs(next)
          save('wx:prefs', next)
        } else {
          // No row yet, so this upsert inserts. user_id defaults to auth.uid() in the table.
          const local = { ...DEFAULT_PREFS, ...load<Partial<Preferences>>('wx:prefs', {}) }
          await supabase!.from(TABLES.prefs).upsert({ units: local.units, wind_unit: local.windUnit, theme: local.theme })
        }
      })
    return () => {
      alive = false
    }
  }, [uid])

  const update = useCallback(
    (patch: Partial<Preferences>) => {
      setPrefs((prev) => {
        const next = { ...prev, ...patch }
        save('wx:prefs', next)
        // Local first, then upsert. The control doesn't wait on the round trip.
        if (supabase && uid) {
          void supabase.from(TABLES.prefs).upsert({ user_id: uid, units: next.units, wind_unit: next.windUnit, theme: next.theme })
        }
        return next
      })
    },
    [uid],
  )

  return { prefs, update }
}
