import Dexie from 'dexie'

const DB_NAME = 'ChronoFlow'
const DB_VERSION = 1
const HEALTH_CHECK_TIMEOUT = 3000

const db = new Dexie(DB_NAME)

db.version(DB_VERSION).stores({
  blocks: 'id, user_id, date, archived, &[user_id+date+start_min], updated_at',
  sync_queue: '++id, status, created_at, record_id',
  settings: '&key',
})

function now() {
  return new Date().toISOString()
}

export const blockToDbRecord = (block, dateStr, userId) => ({
  id: block.id,
  user_id: userId,
  date: dateStr,
  start_min: block.start,
  duration: block.end <= block.start
    ? block.end + 1440 - block.start
    : block.end - block.start,
  label: block.label,
  category: block.category,
  is_recurring: block.is_recurring ? 1 : 0,
  parent_rule_id: block.parent_rule_id || null,
  archived: block.archived ? 1 : 0,
  locked: block.locked ? 1 : 0,
  updated_at: now(),
})

export const blockFromDbRecord = (row) => {
  const end = row.start_min + row.duration
  return {
    id: row.id,
    start: row.start_min,
    end: end > 1440 ? end - 1440 : end,
    label: row.label,
    category: row.category,
    is_recurring: !!row.is_recurring,
    parent_rule_id: row.parent_rule_id || null,
    locked: !!row.locked,
  }
}

export async function seedBlocks(records) {
  const timestamp = now()
  const enriched = records.map(r => ({ ...r, updated_at: timestamp }))
  await db.blocks.bulkPut(enriched)
}

export async function getBlocksByDate(dateStr) {
  const rows = await db.blocks
    .where({ date: dateStr })
    .filter(b => b.archived === 0)
    .toArray()
  return rows.map(blockFromDbRecord)
}

export async function putBlock(block) {
  const record = { ...block, updated_at: now() }
  await db.blocks.put(record)
}

export async function putBlocks(blocks) {
  const timestamp = now()
  const records = blocks.map(b => ({ ...b, updated_at: timestamp }))
  await db.blocks.bulkPut(records)
}

export async function removeBlock(id) {
  await db.blocks.delete(id)
}

export async function markBlockArchived(id) {
  await db.blocks.update(id, { archived: 1, updated_at: now() })
}

export async function getBlock(id) {
  const row = await db.blocks.get(id)
  return row ? blockFromDbRecord(row) : null
}

export async function getAllBlocks() {
  const rows = await db.blocks
    .filter(b => b.archived === 0)
    .toArray()
  return rows.map(blockFromDbRecord)
}

export async function enqueueSyncAction(action) {
  const id = await db.sync_queue.add({
    ...action,
    status: 'pending',
    retry_count: 0,
    created_at: now(),
  })
  return id
}

export async function getPendingSyncActions() {
  return db.sync_queue
    .where({ status: 'pending' })
    .sortBy('created_at')
}

export async function markSyncActionProcessed(id) {
  await db.sync_queue.delete(id)
}

export async function markSyncActionFailed(id) {
  const entry = await db.sync_queue.get(id)
  if (!entry) return
  const retry_count = (entry.retry_count || 0) + 1
  if (retry_count >= 5) {
    await db.sync_queue.update(id, { status: 'failed', retry_count })
  } else {
    await db.sync_queue.update(id, { status: 'pending', retry_count })
  }
}

export async function clearSyncQueue() {
  await db.sync_queue.clear()
}

export async function getSetting(key) {
  const entry = await db.settings.get(key)
  return entry ? entry.value : null
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value })
}

export async function clearUserData(userId) {
  await db.blocks.where({ user_id: userId }).delete()
  await db.sync_queue.clear()
}

export async function checkHealth() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT)
  try {
    await db.open()
    await db.blocks.count()
    await db.sync_queue.count()
    await db.settings.count()
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  } finally {
    clearTimeout(timer)
  }
}

export async function estimateQuota() {
  if (!navigator.storage || !navigator.storage.estimate) {
    return { supported: false }
  }
  const estimate = await navigator.storage.estimate()
  return {
    supported: true,
    usage: estimate.usage,
    quota: estimate.quota,
    percent: estimate.quota > 0 ? Math.round((estimate.usage / estimate.quota) * 100) : 0,
  }
}

export async function closeDb() {
  await db.close()
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      db.close()
    }
  })
}

export { db }
