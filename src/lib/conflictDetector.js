const conflictLog = []
let timestampSkew = 0

export function detectConflict(localBlock, remoteBlock) {
  if (!localBlock && !remoteBlock) return null
  if (!localBlock) {
    return { type: 'local-delete/remote-update', localBlock: null, remoteBlock }
  }
  if (!remoteBlock) {
    return { type: 'local-update/remote-delete', localBlock, remoteBlock: null }
  }

  const localTime = new Date(localBlock.updated_at || 0).getTime()
  const remoteTime = new Date(remoteBlock.updated_at || 0).getTime()

  if (remoteTime > localTime) {
    return { type: 'local-update/remote-update', localBlock, remoteBlock }
  }
  return null
}

export function resolveConflict(conflict, strategy) {
  if (!conflict) return null

  if (typeof conflict === 'object' && conflict.type && conflict.localBlock && conflict.remoteBlock) {
    if (strategy === 'remote-wins') {
      return { ...conflict.remoteBlock }
    }
    if (strategy === 'local-wins') {
      return { ...conflict.localBlock }
    }
    if (strategy === 'manual-merge') {
      return null
    }
  }

  if (conflict.type === 'local-delete/remote-update') {
    if (strategy === 'remote-wins') {
      return { ...conflict.remoteBlock }
    }
    return null
  }

  if (conflict.type === 'local-update/remote-delete') {
    if (strategy === 'local-wins') {
      return { ...conflict.localBlock }
    }
    return null
  }

  return null
}

export function getConflictLog() {
  return [...conflictLog]
}

export function logConflict(conflict) {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[Conflict] Detected:', conflict)
  }
  conflictLog.push({ ...conflict, detectedAt: new Date().toISOString() })
}

export function clearConflictLog() {
  conflictLog.length = 0
}

export function getTimestampSkew() {
  return timestampSkew
}

export function updateTimestampSkew(serverTimestamp) {
  const clientTime = Date.now()
  const serverTime = new Date(serverTimestamp).getTime()
  if (!isNaN(serverTime)) {
    timestampSkew = serverTime - clientTime
  }
}

export function pickFields(localBlock, remoteBlock, fieldSelections) {
  const merged = {}
  for (const field of fieldSelections) {
    merged[field.name] = field.useLocal ? localBlock[field.name] : remoteBlock[field.name]
  }
  return { ...remoteBlock, ...merged }
}
