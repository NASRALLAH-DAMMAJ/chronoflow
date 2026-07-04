import React from 'react'
import { useOffline } from '../hooks/useOffline'

export default function OfflineBanner() {
  const isOffline = useOffline()
  if (!isOffline) return null

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
        backgroundColor: '#e8590c',
        color: '#fff',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      You're offline — changes will sync when reconnected
    </div>
  )
}
