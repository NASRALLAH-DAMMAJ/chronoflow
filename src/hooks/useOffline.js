import { useState, useEffect, useRef, useCallback } from 'react'

const DEBOUNCE_MS = 300
const MAX_LOG_ENTRIES = 50

function getConnection() {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    return navigator.connection
  }
  return null
}

function getInitialStatus(forceOffline = false) {
  if (typeof navigator === 'undefined') {
    return { isOffline: true, type: 'unknown', slow: false, metered: false }
  }
  const conn = getConnection()
  return {
    isOffline: forceOffline || !navigator.onLine,
    type: conn ? conn.effectiveType : 'unknown',
    slow: forceOffline ? false : conn
      ? conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g'
      : false,
    metered: conn ? conn.downlinkMax === 0 : false,
  }
}

let _devLogShown = false
function logThrottleInfo(status) {
  if (typeof window === 'undefined') return
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  if (isDev && !_devLogShown) {
    _devLogShown = true
    console.log('[useOffline] Network status:', status)
    if (status.slow) {
      console.warn('[useOffline] Slow connection detected — synthetic network throttle active')
    }
  }
}

export function useOffline(forceOffline = false) {
  const [status, setStatus] = useState(() => getInitialStatus(forceOffline))
  const [eventLog, setEventLog] = useState([])
  const timerRef = useRef(null)
  const prevOnlineRef = useRef(typeof navigator !== 'undefined' ? navigator.onLine : true)

  const addEvent = useCallback((event) => {
    setEventLog(prev => {
      const entry = { ...event, timestamp: new Date().toISOString() }
      const next = [...prev, entry]
      return next.length > MAX_LOG_ENTRIES ? next.slice(-MAX_LOG_ENTRIES) : next
    })
  }, [])

  const update = useCallback(() => {
    const conn = getConnection()
    const isCurrentlyOffline = forceOffline || (typeof navigator !== 'undefined' && !navigator.onLine)
    setStatus(prev => {
      const next = {
        isOffline: isCurrentlyOffline,
        type: conn ? conn.effectiveType : 'unknown',
        slow: forceOffline ? false : conn
          ? conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g'
          : false,
        metered: conn ? conn.downlinkMax === 0 : false,
      }
      if (prev.isOffline !== next.isOffline || prev.type !== next.type) {
        addEvent({
          type: 'transition',
          from: prev.isOffline ? 'offline' : 'online',
          to: next.isOffline ? 'offline' : 'online',
          connectionType: next.type,
        })
        logThrottleInfo(next)
      }
      return next
    })
  }, [forceOffline, addEvent])

  const debouncedUpdate = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(update, DEBOUNCE_MS)
  }, [update])

  useEffect(() => {
    update()
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
  }, [debouncedUpdate, update])

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

  return { ...status, eventLog }
}
