import { useCallback, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface AuthApi {
  enabled: boolean
  ready: boolean
  user: User | null
  isGuest: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  startGuest: () => Promise<string | null>
  signOut: () => Promise<void>
}

/**
 * Session for the account sheet. `ready` starts true when Supabase isn't
 * configured, so /demo doesn't sit waiting on a client that will never resolve.
 * getSession() fills the first paint. onAuthStateChange keeps it current
 * after that, including sign-in and sign-out.
 * Guest is an anonymous user (is_anonymous), a real row with the same RLS as
 * a password account. "Try as guest" does not seed sample cities; /demo does.
 * null from signIn/signUp/startGuest means the sheet can close. A string is
 * shown in place: an auth error, or the confirm-your-email line when sign-up
 * didn't hand back a session.
 */
export function useAuth(): AuthApi {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(!supabase)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return 'Accounts are not configured'
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return 'Accounts are not configured'
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
    if (error) return error.message
    return data.session ? null : 'Check your inbox to confirm your email, then sign in.'
  }, [])

  const startGuest = useCallback(async () => {
    if (!supabase) return 'Accounts are not configured'
    const { error } = await supabase.auth.signInAnonymously()
    return error?.message ?? null
  }, [])

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut()
  }, [])

  const user = session?.user ?? null
  return { enabled: !!supabase, ready, user, isGuest: !!user?.is_anonymous, signIn, signUp, startGuest, signOut }
}
