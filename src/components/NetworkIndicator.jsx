import React from 'react'
import { useOffline } from '../hooks/useOffline'
import { connectionMonitor } from '../lib/realtime'

const dotBase = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  display: 'inline-block',
  flexShrink: 0,
}

export default function NetworkIndicator() {
  const { isOffline, slow, justCameOnline } = useOffline()
  const [realtimeStatus, setRealtimeStatus] = React.useState(connectionMonitor.getStatus())
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    setVisible(true)
  }, [])

  React.useEffect(() => {
    const unsub = connectionMonitor.onStatusChange(setRealtimeStatus)
    return unsub
  }, [])

  if (!visible) return null

  let color = '#22c55e'
  let title = 'Connected'

  if (justCameOnline) {
    color = '#22c55e'
    title = 'Back online'
  } else if (isOffline) {
    color = '#ef4444'
    title = 'Offline'
  } else if (slow) {
    color = '#f59e0b'
    title = 'Slow connection'
  } else if (realtimeStatus === 'disconnected') {
    color = '#ef4444'
    title = 'Realtime disconnected'
  } else if (realtimeStatus === 'reconnecting') {
    color = '#f59e0b'
    title = 'Reconnecting...'
  }

  return (
    <span
      role="img"
      aria-label={title}
      title={title}
      style={{
        ...dotBase,
        backgroundColor: color,
        animation: justCameOnline ? 'pulse 0.6s ease-in-out 2' : 'none',
      }}
    />
  )
}
