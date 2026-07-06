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
    const b = await getBackend()
    return b[method](...args)
  }
}

const storage = {}
for (const method of METHODS) {
  storage[method] = createMethod(method)
}

export { storage }
