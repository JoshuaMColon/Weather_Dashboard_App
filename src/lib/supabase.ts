import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Accounts are optional. No env vars means this export stays null and the app
 * runs on localStorage. I don't want a thrown client at import time.
 *
 * The anon key is public on purpose. It only identifies the project. Row
 * access is RLS (auth.uid() = user_id) on the weather tables, guests included.
 * The service role key never ships to the browser.
 *
 * storageKey is `wx-auth` instead of Supabase's default project key, so this
 * session has its own localStorage entry on an origin that also talks to
 * this project.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** null when the env vars aren't set: cities stay on this device. */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'wx-auth' } }) : null

/**
 * The Data API doesn't expose the weather schema. That list is a dashboard
 * setting, not something the migration can change, so the client talks to
 * public.weather_* views. Those views are security_invoker: Postgres checks
 * the caller's RLS on weather.*, not the view owner's. A view that ran as
 * the owner would skip the policies.
 */
export const TABLES = { locations: 'weather_saved_locations', prefs: 'weather_user_preferences' } as const
