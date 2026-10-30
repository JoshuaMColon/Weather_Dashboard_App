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
