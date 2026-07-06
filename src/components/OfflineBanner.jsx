import React from 'react'
import { useOffline } from '../hooks/useOffline'

export default function OfflineBanner() {
  const { isOffline, slow } = useOffline()
  if (!isOffline && !slow) return null

  const bg = isOffline ? '#e8590c' : '#f59e0b'
  const msg = isOffline
    ? "You're offline — changes will sync when reconnected"
    : 'Slow connection detected'

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="animate-slide-down"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: '8px 16px',
        backgroundColor: bg,
        color: '#fff',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {msg}
    </div>
  )
}
