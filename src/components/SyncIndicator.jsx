import React, { useState, useEffect, useCallback } from 'react'
import { getQueueStats, getSyncStatus, onSyncStatusChange } from '../lib/syncEngine'

const dotBase = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  display: 'inline-block',
  flexShrink: 0,
}

export default function SyncIndicator({ onSync }) {
  const [status, setStatus] = useState(getSyncStatus)
  const [pendingCount, setPendingCount] = useState(0)
  const [visible, setVisible] = useState(false)

  const refreshStats = useCallback(async () => {
    const stats = await getQueueStats()
    setPendingCount(stats.pendingCount + stats.failedCount)
  }, [])

  useEffect(() => {
    setVisible(true)
    refreshStats()
  }, [refreshStats])

  useEffect(() => {
    const unsub = onSyncStatusChange(setStatus)
    const interval = setInterval(refreshStats, 5000)
    return () => {
      unsub()
      clearInterval(interval)
    }
  }, [refreshStats])

  let color = '#22c55e'
  let title = 'Synced'

  if (status === 'syncing') {
    color = '#f59e0b'
    title = 'Syncing...'
  } else if (status === 'error') {
    color = '#ef4444'
    title = 'Sync error'
  } else if (pendingCount > 0) {
    color = '#f59e0b'
    title = `${pendingCount} unsynced change${pendingCount !== 1 ? 's' : ''}`
  }

  return (
    <button
      onClick={onSync}
      aria-label={title}
      title={title}
      disabled={status === 'syncing'}
      style={{
        display: visible ? 'inline-flex' : 'none',
        alignItems: 'center',
        gap: 4,
        border: 'none',
        background: 'none',
        cursor: status === 'syncing' ? 'default' : 'pointer',
        padding: '2px 4px',
        borderRadius: 4,
        fontFamily: 'inherit',
        fontSize: 11,
        color: 'var(--clr-text-secondary)',
      }}
    >
      <span
        style={{
          ...dotBase,
          backgroundColor: color,
          animation: status === 'syncing' ? 'pulse 0.6s ease-in-out infinite' : 'none',
        }}
      />
      {pendingCount > 0 && (
        <span style={{ fontWeight: 600, color: 'var(--clr-text-secondary)' }}>
          {pendingCount}
        </span>
      )}
    </button>
  )
}
