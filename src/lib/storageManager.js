import * as db from './db'
import { isIndexedDBAvailable, getFallbackStorage } from './storageFallback'

let _backend = null
let _initPromise = null

async function detect() {
  const idbOk = await isIndexedDBAvailable()
  if (idbOk) {
    return { type: 'indexeddb', ...db }
  }
  console.warn('[storageManager] IndexedDB unavailable, falling back to localStorage')
  return { type: 'localstorage', ...getFallbackStorage() }
}

async function getBackend() {
  if (!_backend) {
    if (!_initPromise) _initPromise = detect()
    _backend = await _initPromise
  }
  return _backend
}

export async function getStorageInfo() {
  const b = await getBackend()
  const quota = b.estimateQuota ? await b.estimateQuota() : { supported: false }
  return { type: b.type, ...quota }
}

export async function verifyIntegrity() {
  const b = await getBackend()
  const health = b.checkHealth ? await b.checkHealth() : { ok: true }
  return { ...health, backend: b.type }
}

const METHODS = [
  'seedBlocks', 'getBlocksByDate', 'putBlock', 'putBlocks',
  'removeBlock', 'markBlockArchived', 'getBlock', 'getAllBlocks',
  'enqueueSyncAction', 'getPendingSyncActions', 'markSyncActionProcessed',
  'markSyncActionFailed', 'clearSyncQueue', 'getSetting', 'setSetting',
  'clearUserData', 'checkHealth', 'estimateQuota',
]

function createMethod(method) {
  return async (...args) => {
    try {
      const b = await getBackend()
      // Ensure DB is open before operation
      if (b.db && !b.db.isOpen()) {
        await b.db.open()
      }
      return await b[method](...args)
    } catch (err) {
      // Silently handle DatabaseClosedError and other transient errors
      if (err.name === 'DatabaseClosedError') {
        console.warn('[Storage] DB closed during', method, '- attempting reopen')
        try {
          const b = await getBackend()
          if (b.db && !b.db.isOpen()) {
            await b.db.open()
          }
          return await b[method](...args)
        } catch (retryErr) {
          console.warn('[Storage] Retry failed for', method)
        }
      }
      // Return safe defaults for read operations
      if (method === 'getBlocksByDate' || method === 'getAllBlocks') return []
      if (method === 'getBlock') return null
      if (method === 'getSetting') return null
      if (method === 'getPendingSyncActions') return []
      if (method === 'estimateQuota') return { supported: false }
      if (method === 'checkHealth') return { ok: false, error: err.message }
    }
  }
}

const storage = {}
for (const method of METHODS) {
  storage[method] = createMethod(method)
}

export { storage }
