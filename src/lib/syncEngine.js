import { enqueueSyncAction, getPendingSyncActions, markSyncActionProcessed, markSyncActionFailed, db } from './db'

let isSyncing = false
let _syncStatus = 'idle'
const syncListeners = new Set()

function notifyListeners() {
  for (const fn of syncListeners) {
    try { fn(_syncStatus) } catch {}
  }
}

function setSyncStatus(status) {
  if (status !== _syncStatus) {
    _syncStatus = status
    notifyListeners()
  }
}

export function onSyncStatusChange(fn) {
  syncListeners.add(fn)
  return () => syncListeners.delete(fn)
}

export function getSyncStatus() {
  return _syncStatus
}

function sleep(ms) {
  if (process.env.NODE_ENV === 'test') return Promise.resolve()
  return new Promise(r => setTimeout(r, ms))
}

function backoffDelay(attempt) {
  if (process.env.NODE_ENV === 'test') return 0
  const base = 1000
  const max = 30000
  const exponential = Math.min(base * Math.pow(2, attempt), max)
  const jitter = Math.random() * 1000
  return exponential + jitter
}

export async function enqueueForSync(action, recordId, payload) {
  if (action === 'upsert') {
    const existing = await db.sync_queue
      .where({ record_id: recordId, action: 'upsert', status: 'pending' })
      .toArray()

    if (existing.length > 0) {
      const entry = existing[existing.length - 1]
      await db.sync_queue.update(entry.id, {
        payload,
        created_at: new Date().toISOString(),
      })
      return entry.id
    }
  }

  if (action === 'delete') {
    await db.sync_queue
      .where({ record_id: recordId, action: 'upsert', status: 'pending' })
      .delete()
  }

  return enqueueSyncAction({ action, table: 'blocks', record_id: recordId, payload })
}

export async function processSyncQueue(supabase, onProgress) {
  if (isSyncing) return
  isSyncing = true
  setSyncStatus('syncing')

  try {
    const pending = await getPendingSyncActions()
    if (pending.length === 0) {
      setSyncStatus('idle')
      return
    }

    const creates = pending.filter(e => e.action === 'upsert')
    const deletes = pending.filter(e => e.action === 'delete')
    const ordered = [...creates, ...deletes]
    const total = ordered.length

    for (let i = 0; i < ordered.length; i++) {
      const entry = ordered[i]
      let success = false

      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          if (entry.action === 'upsert') {
            const blocksData = entry.payload
              ? entry.payload.blocks || (Array.isArray(entry.payload) ? entry.payload : [entry.payload])
              : []
            if (blocksData.length > 0) {
              const { error } = await supabase
                .from('blocks')
                .upsert(blocksData, { onConflict: 'id' })
              if (error) throw error
            }
          } else if (entry.action === 'delete') {
            const { error } = await supabase
              .from('blocks')
              .delete()
              .eq('id', entry.record_id)
            if (error) throw error
          }

          await markSyncActionProcessed(entry.id)
          success = true
          break
        } catch (err) {
          await markSyncActionFailed(entry.id)
          if (attempt < 4) {
            const delay = backoffDelay(attempt)
            await sleep(delay)
          }
        }
      }

      if (onProgress) {
        onProgress(i + 1, total)
      }
    }

    setSyncStatus('idle')
  } catch (err) {
    setSyncStatus('error')
  } finally {
    isSyncing = false
  }
}

export async function getQueueStats() {
  const all = await db.sync_queue.toArray()
  const pending = all.filter(e => e.status === 'pending')
  const failed = all.filter(e => e.status === 'failed')

  let oldestAge = null
  if (pending.length > 0) {
    const oldest = pending.reduce((a, b) => a.created_at < b.created_at ? a : b)
    oldestAge = Date.now() - new Date(oldest.created_at).getTime()
  }

  return {
    pendingCount: pending.length,
    failedCount: failed.length,
    oldestItemAge: oldestAge,
  }
}

export async function clearFailedActions() {
  await db.sync_queue.where({ status: 'failed' }).delete()
}

export async function purgeStaleActions(maxAgeDays = 30) {
  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString()
  await db.sync_queue.where('created_at').below(cutoff).delete()
}
