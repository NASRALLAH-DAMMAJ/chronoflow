import { blockFromDbRecord } from './db'

const PREFIX = 'chronoflow_'
const BLOCKS_KEY = PREFIX + 'blocks'
const SYNC_QUEUE_KEY = PREFIX + 'sync_queue'
const SETTINGS_KEY = PREFIX + 'settings'
const QUOTA_WARN_THRESHOLD = 0.85

function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

function now() {
  return new Date().toISOString()
}

function getUsedStorage() {
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    const val = localStorage.getItem(key)
    total += (key ? key.length : 0) + (val ? val.length : 0)
  }
  return total
}

export function isIndexedDBAvailable() {
  try {
    if (typeof indexedDB === 'undefined' || typeof window === 'undefined') return Promise.resolve(false)
    const req = indexedDB.open('__chronoflow_idb_test__', 1)
    return new Promise((resolve) => {
      req.onerror = () => resolve(false)
      req.onsuccess = () => {
        indexedDB.deleteDatabase('__chronoflow_idb_test__')
        resolve(true)
      }
    })
  } catch {
    return Promise.resolve(false)
  }
}

export function isSafariPrivateMode() {
  try {
    localStorage.setItem('__chronoflow_test__', '1')
    localStorage.removeItem('__chronoflow_test__')
    return false
  } catch {
    return true
  }
}

export function getFallbackStorage() {
  function getBlocksData() {
    const data = readJSON(BLOCKS_KEY, {})
    checkQuota()
    return data
  }

  function saveBlocksData(data) {
    writeJSON(BLOCKS_KEY, data)
    checkQuota()
  }

  function getSyncQueue() {
    return readJSON(SYNC_QUEUE_KEY, [])
  }

  function saveSyncQueue(data) {
    writeJSON(SYNC_QUEUE_KEY, data)
  }

  function checkQuota() {
    const usage = getUsedStorage()
    const quota = 5 * 1024 * 1024
    const percent = quota > 0 ? usage / quota : 0
    if (percent > QUOTA_WARN_THRESHOLD) {
      console.warn(`[storageFallback] Storage ${Math.round(percent * 100)}% full — consider pruning`)
    }
    return { usage, quota, percent }
  }

  async function seedBlocks(records) {
    const blocks = getBlocksData()
    const ts = now()
    for (const r of records) {
      blocks[r.id] = { ...r, updated_at: ts }
    }
    saveBlocksData(blocks)
  }

  async function getBlocksByDate(dateStr) {
    const blocks = getBlocksData()
    return Object.values(blocks)
      .filter(b => b.date === dateStr && b.archived === 0)
      .map(blockFromDbRecord)
  }

  async function putBlock(block) {
    const blocks = getBlocksData()
    blocks[block.id] = { ...block, updated_at: now() }
    saveBlocksData(blocks)
  }

  async function putBlocks(records) {
    const blocks = getBlocksData()
    const ts = now()
    for (const r of records) {
      blocks[r.id] = { ...r, updated_at: ts }
    }
    saveBlocksData(blocks)
  }

  async function removeBlock(id) {
    const blocks = getBlocksData()
    delete blocks[id]
    saveBlocksData(blocks)
  }

  async function markBlockArchived(id) {
    const blocks = getBlocksData()
    if (blocks[id]) {
      blocks[id].archived = 1
      blocks[id].updated_at = now()
      saveBlocksData(blocks)
    }
  }

  async function getBlock(id) {
    const blocks = getBlocksData()
    const row = blocks[id]
    return row ? blockFromDbRecord(row) : null
  }

  async function getAllBlocks() {
    const blocks = getBlocksData()
    return Object.values(blocks)
      .filter(b => b.archived === 0)
      .map(blockFromDbRecord)
  }

  async function enqueueSyncAction(action) {
    const queue = getSyncQueue()
    const id = queue.length > 0 ? Math.max(...queue.map(q => q.id)) + 1 : 1
    const entry = {
      id,
      ...action,
      status: 'pending',
      retry_count: 0,
      created_at: now(),
    }
    queue.push(entry)
    saveSyncQueue(queue)
    return id
  }

  async function getPendingSyncActions() {
    const queue = getSyncQueue()
    return queue.filter(q => q.status === 'pending').sort((a, b) => a.created_at.localeCompare(b.created_at))
  }

  async function markSyncActionProcessed(id) {
    const queue = getSyncQueue()
    const idx = queue.findIndex(q => q.id === id)
    if (idx !== -1) {
      queue.splice(idx, 1)
      saveSyncQueue(queue)
    }
  }

  async function markSyncActionFailed(id) {
    const queue = getSyncQueue()
    const entry = queue.find(q => q.id === id)
    if (!entry) return
    entry.retry_count = (entry.retry_count || 0) + 1
    if (entry.retry_count >= 5) {
      entry.status = 'failed'
    }
    saveSyncQueue(queue)
  }

  async function clearSyncQueue() {
    saveSyncQueue([])
  }

  async function getSetting(key) {
    const settings = readJSON(SETTINGS_KEY, {})
    return settings[key] ?? null
  }

  async function setSetting(key, value) {
    const settings = readJSON(SETTINGS_KEY, {})
    settings[key] = value
    writeJSON(SETTINGS_KEY, settings)
  }

  async function clearUserData(userId) {
    const blocks = getBlocksData()
    for (const id of Object.keys(blocks)) {
      if (blocks[id].user_id === userId) delete blocks[id]
    }
    saveBlocksData(blocks)
    saveSyncQueue([])
  }

  async function checkHealth() {
    try {
      const blocks = getBlocksData()
      const queue = getSyncQueue()
      return { ok: true, blocksCount: Object.keys(blocks).length, syncQueueCount: queue.length }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  async function estimateQuota() {
    const usage = getUsedStorage()
    const quota = 5 * 1024 * 1024
    return {
      supported: true,
      usage,
      quota,
      percent: quota > 0 ? Math.round((usage / quota) * 100) : 0,
    }
  }

  async function emergencyPrune() {
    const blocks = getBlocksData()
    const entries = Object.entries(blocks)
    const sorted = entries.sort((a, b) => {
      const aArch = a[1].archived ? 1 : 0
      const bArch = b[1].archived ? 1 : 0
      if (aArch !== bArch) return bArch - aArch
      return (a[1].updated_at || '').localeCompare(b[1].updated_at || '')
    })
    const targetThreshold = QUOTA_WARN_THRESHOLD * 5 * 1024 * 1024
    let usage = getUsedStorage()
    const removed = []
    for (const [id] of sorted) {
      if (usage <= targetThreshold) break
      delete blocks[id]
      removed.push(id)
      usage = getUsedStorage()
    }
    saveBlocksData(blocks)
    if (removed.length > 0) {
      console.warn(`[storageFallback] Emergency pruned ${removed.length} blocks`)
    }
    return { removed }
  }

  return {
    seedBlocks,
    getBlocksByDate,
    putBlock,
    putBlocks,
    removeBlock,
    markBlockArchived,
    getBlock,
    getAllBlocks,
    enqueueSyncAction,
    getPendingSyncActions,
    markSyncActionProcessed,
    markSyncActionFailed,
    clearSyncQueue,
    getSetting,
    setSetting,
    clearUserData,
    checkHealth,
    estimateQuota,
    emergencyPrune,
  }
}
