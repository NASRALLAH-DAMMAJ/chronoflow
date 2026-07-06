import { useState, useEffect, useRef, useCallback } from 'react'

const DEBOUNCE_MS = 300

function getConnection() {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    return navigator.connection
  }
  return null
}

function getInitialStatus() {
  if (typeof navigator === 'undefined') {
    return { isOffline: true, type: 'unknown', slow: false, metered: false }
  }
  const conn = getConnection()
  return {
    isOffline: !navigator.onLine,
    type: conn ? conn.effectiveType : 'unknown',
    slow: conn ? conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' : false,
    metered: conn ? conn.downlinkMax === 0 : false,
  }
}

export function useOffline() {
  const [status, setStatus] = useState(getInitialStatus)
  const timerRef = useRef(null)
  const prevOnlineRef = useRef(navigator.onLine)

  const update = useCallback(() => {
    const conn = getConnection()
    setStatus({
      isOffline: !navigator.onLine,
      type: conn ? conn.effectiveType : 'unknown',
      slow: conn
        ? conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g'
        : false,
      metered: conn ? conn.downlinkMax === 0 : false,
    })
  }, [])

  const debouncedUpdate = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(update, DEBOUNCE_MS)
  }, [update])

  useEffect(() => {
    window.addEventListener('online', debouncedUpdate)
    window.addEventListener('offline', debouncedUpdate)
    const conn = getConnection()
    if (conn) {
      conn.addEventListener('change', debouncedUpdate)
    }
    return () => {
      window.removeEventListener('online', debouncedUpdate)
      window.removeEventListener('offline', debouncedUpdate)
      if (conn) {
        conn.removeEventListener('change', debouncedUpdate)
      }
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [debouncedUpdate])

  useEffect(() => {
    const wasOffline = prevOnlineRef.current === false
    const nowOffline = status.isOffline
    prevOnlineRef.current = !status.isOffline
    if (wasOffline && !nowOffline) {
      setStatus(s => ({ ...s, justCameOnline: true }))
      const t = setTimeout(() => setStatus(s => ({ ...s, justCameOnline: false })), 1000)
      return () => clearTimeout(t)
    }
  }, [status.isOffline])

  return status
}
