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

const tooltipStyle = {
  position: 'absolute',
  top: '100%',
  right: 0,
  marginTop: 4,
  padding: '8px 12px',
  background: '#1e1e1e',
  color: '#e0e0e0',
  borderRadius: 6,
  fontSize: 12,
  lineHeight: 1.5,
  whiteSpace: 'nowrap',
  zIndex: 1000,
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
}

export default function NetworkIndicator({ forceOffline = false, pendingSyncCount = 0 }) {
  const { isOffline, slow, justCameOnline, type, metered, eventLog } = useOffline(forceOffline)
  const [realtimeStatus, setRealtimeStatus] = React.useState(connectionMonitor.getStatus())
  const [visible, setVisible] = React.useState(false)
  const [showTooltip, setShowTooltip] = React.useState(false)

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

  const queueInfo = pendingSyncCount > 0 ? ` | ${pendingSyncCount} pending changes` : ''

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <span
        role="img"
        aria-label={title}
        title={title + queueInfo}
        style={{
          ...dotBase,
          backgroundColor: color,
          animation: justCameOnline ? 'pulse 0.6s ease-in-out 2' : 'none',
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      />
      {pendingSyncCount > 0 && (
        <span
          style={{
            fontSize: 10,
            marginLeft: 2,
            color: '#f59e0b',
            fontWeight: 600,
          }}
        >
          ({pendingSyncCount})
        </span>
      )}
      {showTooltip && (
        <div style={tooltipStyle} role="tooltip">
          <div><strong>Network:</strong> {title}{isOffline && forceOffline ? ' (forced)' : ''}</div>
          <div><strong>Connection:</strong> {type}</div>
          <div><strong>Realtime:</strong> {realtimeStatus}</div>
          {metered && <div><strong>Metered:</strong> yes</div>}
          {pendingSyncCount > 0 && <div><strong>Offline queue:</strong> {pendingSyncCount} items</div>}
          <div style={{ marginTop: 4, fontSize: 10, color: '#999' }}>
            Last {eventLog.length} event{eventLog.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
