import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const SupabaseContext = createContext(null)

export function SupabaseProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const hash = window.location.hash
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''))

    if (hashParams.has('access_token')) {
      // Strip tokens from URL immediately to prevent referrer leakage
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      window.history.replaceState(null, '', window.location.pathname)

      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ data: { session }, error }) => {
        if (!error && session) {
          setSession(session)
          setUser(session.user)
        }
        setLoading(false)
      }).catch(() => setLoading(false))
    } else {
      supabase.auth.getSession()
        .then(({ data: { session } }) => {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <SupabaseContext.Provider value={{ supabase, session, user, loading }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext)
  if (!ctx) throw new Error('useSupabase must be used within SupabaseProvider')
  return ctx
}
