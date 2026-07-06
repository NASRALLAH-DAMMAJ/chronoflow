import { blockFromDb } from './blocks'

const recentlyLocalModified = new Map()
const ECHO_THRESHOLD_MS = 500
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [id, ts] of recentlyLocalModified) {
      if (now - ts > ECHO_THRESHOLD_MS) {
        recentlyLocalModified.delete(id)
      }
    }
  }, 1000)
}

export function markLocalChange(blockId) {
  if (blockId) recentlyLocalModified.set(blockId, Date.now())
}

function isEcho(blockId) {
  if (!blockId) return false
  const ts = recentlyLocalModified.get(blockId)
  if (ts && Date.now() - ts < ECHO_THRESHOLD_MS) {
    recentlyLocalModified.delete(blockId)
    return true
  }
  return false
}

export function setupRealtimeSubscription(supabase, userId, onBlockChange) {
  let unsubscribeCalled = false
  let reconnectAttempts = 0
  let reconnectTimer = null
  const MAX_RECONNECT_DELAY = 30000

  const channel = supabase.channel('blocks-realtime', {
    selfBroadcast: true,
  })

  const mon = connectionMonitor
  mon.startHeartbeat()

  function scheduleReconnect() {
    if (unsubscribeCalled) return
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY)
    reconnectAttempts++
    mon.status = 'reconnecting'
    reconnectTimer = setTimeout(() => {
      if (!unsubscribeCalled) {
        channel.subscribe()
      }
    }, delay)
  }

  channel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'blocks',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const blockId = payload.new?.id || payload.old?.id
        if (isEcho(blockId)) {
          console.log("[Realtime] Echo detected and ignored:", blockId)
          return
        }
        mon.recordPong()
        console.log("[Realtime] Change received:", payload)
        onBlockChange(payload)
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        reconnectAttempts = 0
        mon.status = 'connected'
        mon.recordPong()
        console.log("[Realtime] Change received:", payload)
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        mon.status = 'reconnecting'
        scheduleReconnect()
      }
    })

  return function unsubscribe() {
    unsubscribeCalled = true
    mon.status = 'disconnected'
    mon.stopHeartbeat()
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    channel.unsubscribe()
  }
}

export function createConnectionMonitor() {
  let status = 'disconnected'
  const listeners = new Set()
  let heartbeatInterval = null
  let lastPong = Date.now()
  const HEARTBEAT_INTERVAL = 30000
  const STALE_THRESHOLD = 45000

  function setStatus(newStatus) {
    if (newStatus !== status) {
      status = newStatus
      listeners.forEach(fn => { try { fn(status) } catch {} })
    }
  }

  function startHeartbeat() {
    stopHeartbeat()
    lastPong = Date.now()
    heartbeatInterval = setInterval(() => {
      if (Date.now() - lastPong > STALE_THRESHOLD) {
        setStatus('disconnected')
      }
    }, HEARTBEAT_INTERVAL)
  }

  function stopHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
  }

  return {
    get status() { return status },
    set status(val) { setStatus(val) },
    onStatusChange(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    getStatus() { return status },
    startHeartbeat,
    stopHeartbeat,
    recordPong() { lastPong = Date.now() },
  }
}

export function realtimeBlockFromPayload(row) {
  if (!row) return null
  return {
    ...blockFromDb(row),
    archived: row.archived || false,
  }
}

export function realtimeRecordFromPayload(row) {
  if (!row) return null
  return {
    id: row.id,
    user_id: row.user_id,
    date: row.date,
    start_min: row.start_min,
    duration: row.duration,
    label: row.label,
    category: row.category,
    is_recurring: row.is_recurring || false,
    parent_rule_id: row.parent_rule_id || null,
    archived: row.archived || false,
    locked: row.locked || false,
    updated_at: row.updated_at || null,
  }
}

export const connectionMonitor = createConnectionMonitor()
