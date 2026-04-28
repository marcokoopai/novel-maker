import { useCallback, useEffect, useMemo, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { getSupabase, supabaseConfigError } from '../lib/supabase'

export type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'update-password'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (supabaseConfigError) {
      setLoading(false)
      return
    }

    const supabase = getSupabase()
    let mounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) setError(error.message)
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase()
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await supabase.auth.signOut({ scope: 'others' })
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase()
    setError('')
    const { error, data } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.session) await supabase.auth.signOut({ scope: 'others' })
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    const supabase = getSupabase()
    setError('')
    const redirectTo = window.location.origin + '/update-password'
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) throw error
  }, [])

  const updatePassword = useCallback(async (password: string, currentPassword?: string) => {
    const supabase = getSupabase()
    setError('')
    const payload = currentPassword ? { password, currentPassword } : { password }
    const { error } = await supabase.auth.updateUser(payload)
    if (error) throw error
    await supabase.auth.signOut({ scope: 'others' })
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabase()
    setError('')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  return useMemo(() => ({
    session,
    user: session?.user as User | undefined,
    loading,
    error,
    setError,
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    updatePassword,
  }), [session, loading, error, signIn, signUp, signOut, requestPasswordReset, updatePassword])
}
