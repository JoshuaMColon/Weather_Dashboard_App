import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** null when the env vars aren't set: the app then runs local-only (localStorage cities). */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'wx-auth' } }) : null

/**
 * Data lives in the dedicated `weather` schema. The Data API reaches it through
 * thin security_invoker views (public.weather_*), so RLS on weather.* applies.
 */
export const TABLES = { locations: 'weather_saved_locations', prefs: 'weather_user_preferences' } as const
