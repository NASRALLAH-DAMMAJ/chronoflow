import Dexie from 'dexie'

/**
 * ChronoFlow IndexedDB Schema
 *
 * Database: ChronoFlow (Dexie wrapper over IndexedDB)
 * Version: 1
 *
 * ── Table: blocks ──────────────────────────────────────────────
 * Primary key: id (UUID string)
 * Indexes:    user_id, date, archived, [user_id+date+start_min], updated_at
 *
 * @field {string}  id             - UUID unique block identifier
 * @field {string}  user_id        - Supabase auth user ID
 * @field {string}  date           - Date string in YYYY-MM-DD format
 * @field {number}  start_min      - Start minute of the day (0-1439)
 * @field {number}  duration       - Duration in minutes (1-1440)
 * @field {string}  label          - Human-readable block label
 * @field {string}  category       - One of: work, sleep, exercise, meal, leisure,
 *                                   family, commute, chores, self-care, other
 * @field {number}  is_recurring   - 1 if generated from a recurring rule, else 0
 * @field {string|null} parent_rule_id - FK to recurring_rules table (nullable)
 * @field {number}  archived       - 1 if archived (soft-deleted), else 0
 * @field {number}  locked         - 1 if protected from auto-reschedule, else 0
 * @field {string}  updated_at     - ISO 8601 timestamp of last write
 *
 * ── Table: sync_queue ──────────────────────────────────────────
 * Primary key: id (auto-increment integer)
 * Indexes:    status, created_at, record_id
 *
 * @field {number}  id             - Auto-increment primary key
 * @field {string}  action         - Operation type: 'upsert' | 'delete'
 * @field {string}  table          - Target table name (e.g. 'blocks')
 * @field {string}  record_id      - ID of the affected record
 * @field {object}  [payload]      - Full record data for upsert operations
 * @field {string}  status         - 'pending' | 'failed'
 * @field {number}  retry_count    - Number of failed processing attempts
 * @field {string}  created_at     - ISO 8601 timestamp
 *
 * ── Table: settings ────────────────────────────────────────────
 * Primary key: key (string, unique)
 *
 * @field {string}  key            - Setting key (e.g. 'theme', 'locale')
 * @field {*}       value          - Arbitrary setting value
 */

const DB_NAME = 'ChronoFlow'
const DB_VERSION = 1
const HEALTH_CHECK_TIMEOUT = 3000

const db = new Dexie(DB_NAME)

db.version(DB_VERSION).stores({
  blocks: 'id, user_id, date, archived, &[user_id+date+start_min], updated_at',
  sync_queue: '++id, status, created_at, record_id',
  settings: '&key',
})

// ── Performance metrics ──────────────────────────────────────
const _metrics = {
  dbOpenedAt: null,
  operations: {},
  _initialized: false,
}

function _initMetrics() {
  if (!_metrics._initialized) {
    _metrics.dbOpenedAt = typeof performance !== 'undefined' ? performance.now() : null
    _metrics._initialized = true
  }
}

function _trackOp(name) {
  _initMetrics()
  const start = typeof performance !== 'undefined' ? performance.now() : 0
  return () => {
    if (typeof performance === 'undefined') return
    const dur = performance.now() - start
    if (!_metrics.operations[name]) _metrics.operations[name] = []
    _metrics.operations[name].push(dur)
  }
}

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
    updated_at: row.updated_at || null,
  }
}

export async function seedBlocks(records) {
  const end = _trackOp('seedBlocks')
  try {
    const timestamp = now()
    const enriched = records.map(r => ({ ...r, updated_at: timestamp }))
    await db.blocks.bulkPut(enriched)
  } finally {
    end()
  }
}

export async function getBlocksByDate(dateStr) {
  const end = _trackOp('getBlocksByDate')
  try {
    const rows = await db.blocks
      .where({ date: dateStr })
      .filter(b => b.archived === 0)
      .toArray()
    return rows.map(blockFromDbRecord)
  } finally {
    end()
  }
}

export async function putBlock(block) {
  const end = _trackOp('putBlock')
  try {
    const record = { ...block, updated_at: now() }
    await db.blocks.put(record)
  } finally {
    end()
  }
}

export async function putBlocks(blocks) {
  const end = _trackOp('putBlocks')
  try {
    const timestamp = now()
    const records = blocks.map(b => ({ ...b, updated_at: timestamp }))
    await db.blocks.bulkPut(records)
  } finally {
    end()
  }
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

export async function getDbMetrics() {
  _initMetrics()
  await db.open()
  const [blocksCount, syncQueueCount, settingsCount] = await Promise.all([
    db.blocks.count(),
    db.sync_queue.count(),
    db.settings.count(),
  ])
  const connectedAt = _metrics.dbOpenedAt
  const ops = Object.entries(_metrics.operations).map(([k, v]) => [
    k,
    {
      count: v.length,
      totalMs: +v.reduce((a, b) => a + b, 0).toFixed(2),
    },
  ])
  return {
    connectedAt,
    connectedFor:
      connectedAt != null && typeof performance !== 'undefined'
        ? +(performance.now() - connectedAt).toFixed(2)
        : null,
    blocksCount,
    syncQueueCount,
    settingsCount,
    operations: Object.fromEntries(ops),
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
      // Only close if no pending operations
      if (db.isOpen()) {
        db.close()
      }
    } else if (document.visibilityState === 'visible') {
      // Reopen if needed
      if (!db.isOpen()) {
        db.open().catch(() => {})
      }
    }
  })
}

export { db }
