import React from 'react'
import { useOffline } from '../hooks/useOffline'

const dotBase = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  display: 'inline-block',
  flexShrink: 0,
}

export default function NetworkIndicator() {
  const { isOffline, slow, justCameOnline } = useOffline()
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    setVisible(true)
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
