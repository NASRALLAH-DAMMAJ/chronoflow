import { useEffect, useRef } from 'react'
import { useSupabase } from '../lib/SupabaseContext'

const SESSION_CHECK_INTERVAL_MS = 60 * 1000
const SESSION_EXPIRY_BUFFER_MS = 5 * 60 * 1000

export function useSessionMonitor() {
  const { supabase } = useSupabase()
  const timerRef = useRef(null)

  useEffect(() => {
    if (!supabase) return

    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const expiresAt = session.expires_at
        if (!expiresAt) return

        const now = Math.floor(Date.now() / 1000)
        const timeUntilExpiry = (expiresAt - now) * 1000

        if (timeUntilExpiry <= SESSION_EXPIRY_BUFFER_MS) {
          const { error } = await supabase.auth.refreshSession()
          if (error) {
            console.error('[SessionMonitor] Refresh failed:', error)
          }
        }
      } catch (err) {
        console.error('[SessionMonitor] Check failed:', err)
      }
    }

    checkSession()
    timerRef.current = setInterval(checkSession, SESSION_CHECK_INTERVAL_MS)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [supabase])
}
