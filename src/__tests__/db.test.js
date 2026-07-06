import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import {
  blockToDbRecord, blockFromDbRecord,
  seedBlocks, getBlocksByDate, putBlock, putBlocks,
  removeBlock, markBlockArchived, getBlock, getAllBlocks,
  enqueueSyncAction, getPendingSyncActions, markSyncActionProcessed,
  markSyncActionFailed, clearSyncQueue,
  getSetting, setSetting, clearUserData, checkHealth,
  estimateQuota, closeDb, db,
} from '../lib/db'

const userId = 'test-user-1'
const today = '2026-07-06'
const makeBlock = (id, start, end, overrides = {}) => ({
  id, start, end, label: 'Test', category: 'work', userId,
  ...overrides,
})

const makeRecord = (id, start, dur, overrides = {}) => ({
  id, user_id: userId, date: today,
  start_min: start, duration: dur,
  label: 'Test', category: 'work',
  is_recurring: 0, parent_rule_id: null,
  archived: 0, locked: 0,
  ...overrides,
})

beforeEach(async () => {
  await db.blocks.clear()
  await db.sync_queue.clear()
  await db.settings.clear()
})

describe('blockToDbRecord / blockFromDbRecord', () => {
  it('converts block to db record and back', () => {
    const block = { id: 'b1', start: 60, end: 120, label: 'Test', category: 'work' }
    const record = blockToDbRecord(block, today, userId)
    expect(record.id).toBe('b1')
    expect(record.start_min).toBe(60)
    expect(record.duration).toBe(60)
    expect(record.user_id).toBe(userId)
    const back = blockFromDbRecord(record)
    expect(back.id).toBe('b1')
    expect(back.start).toBe(60)
    expect(back.end).toBe(120)
  })

  it('handles midnight-wrapping blocks', () => {
    const block = { id: 'b2', start: 1380, end: 60, label: 'Late', category: 'work' }
    const record = blockToDbRecord(block, today, userId)
    expect(record.duration).toBe(120)
    const back = blockFromDbRecord(record)
    expect(back.start).toBe(1380)
    expect(back.end).toBe(60)
  })
})

describe('seedBlocks', () => {
  it('stores multiple records', async () => {
    const records = [makeRecord('b1', 0, 60), makeRecord('b2', 120, 30)]
    await seedBlocks(records)
    const count = await db.blocks.count()
    expect(count).toBe(2)
  })
})

describe('getBlocksByDate', () => {
  it('returns blocks for given date', async () => {
    await seedBlocks([makeRecord('b1', 0, 60), makeRecord('b2', 120, 30)])
    const blocks = await getBlocksByDate(today)
    expect(blocks).toHaveLength(2)
    expect(blocks[0].start).toBe(0)
  })

  it('excludes archived blocks', async () => {
    await seedBlocks([
      makeRecord('b1', 0, 60),
      makeRecord('b2', 120, 30, { archived: 1 }),
    ])
    const blocks = await getBlocksByDate(today)
    expect(blocks).toHaveLength(1)
  })

  it('returns empty array for unknown date', async () => {
    const blocks = await getBlocksByDate('2099-01-01')
    expect(blocks).toEqual([])
  })
})

describe('putBlock / getBlock', () => {
  it('stores and retrieves a single block', async () => {
    await putBlock(makeRecord('b1', 60, 30))
    const block = await getBlock('b1')
    expect(block).not.toBeNull()
    expect(block.start).toBe(60)
  })

  it('returns null for missing block', async () => {
    const block = await getBlock('nonexistent')
    expect(block).toBeNull()
  })
})

describe('putBlocks', () => {
  it('stores multiple blocks at once', async () => {
    await putBlocks([makeRecord('b1', 0, 60), makeRecord('b2', 120, 30)])
    const count = await db.blocks.count()
    expect(count).toBe(2)
  })
})

describe('removeBlock', () => {
  it('deletes a block by id', async () => {
    await db.blocks.add(makeRecord('b1', 0, 60))
    await removeBlock('b1')
    const block = await db.blocks.get('b1')
    expect(block).toBeUndefined()
  })
})

describe('markBlockArchived', () => {
  it('sets archived flag', async () => {
    await db.blocks.add(makeRecord('b1', 0, 60))
    await markBlockArchived('b1')
    const block = await db.blocks.get('b1')
    expect(block.archived).toBe(1)
  })
})

describe('getAllBlocks', () => {
  it('returns all non-archived blocks', async () => {
    await putBlocks([
      makeRecord('b1', 0, 60),
      makeRecord('b2', 120, 30, { archived: 1 }),
      makeRecord('b3', 240, 15),
    ])
    const blocks = await getAllBlocks()
    expect(blocks).toHaveLength(2)
  })
})

describe('sync queue', () => {
  it('enqueues and retrieves pending actions', async () => {
    await enqueueSyncAction({ action: 'upsert', table: 'blocks', record_id: 'b1', payload: {} })
    const pending = await getPendingSyncActions()
    expect(pending).toHaveLength(1)
    expect(pending[0].action).toBe('upsert')
    expect(pending[0].status).toBe('pending')
  })

  it('marks action as processed (deletes)', async () => {
    const id = await enqueueSyncAction({ action: 'delete', table: 'blocks', record_id: 'b1' })
    await markSyncActionProcessed(id)
    const remaining = await db.sync_queue.count()
    expect(remaining).toBe(0)
  })

  it('increments retry count on failure then marks failed at 5', async () => {
    const id = await enqueueSyncAction({ action: 'upsert', table: 'blocks', record_id: 'b1' })
    for (let i = 0; i < 4; i++) {
      await markSyncActionFailed(id)
    }
    let entry = await db.sync_queue.get(id)
    expect(entry.retry_count).toBe(4)
    expect(entry.status).toBe('pending')
    await markSyncActionFailed(id)
    entry = await db.sync_queue.get(id)
    expect(entry.status).toBe('failed')
    expect(entry.retry_count).toBe(5)
  })

  it('clears all sync actions', async () => {
    await enqueueSyncAction({ action: 'upsert', table: 'blocks', record_id: 'b1' })
    await enqueueSyncAction({ action: 'delete', table: 'blocks', record_id: 'b2' })
    await clearSyncQueue()
    const count = await db.sync_queue.count()
    expect(count).toBe(0)
  })
})

describe('settings', () => {
  it('stores and retrieves a setting', async () => {
    await setSetting('theme', 'dark')
    const val = await getSetting('theme')
    expect(val).toBe('dark')
  })

  it('returns null for missing key', async () => {
    const val = await getSetting('nonexistent')
    expect(val).toBeNull()
  })

  it('overwrites existing key', async () => {
    await setSetting('theme', 'light')
    await setSetting('theme', 'dark')
    const val = await getSetting('theme')
    expect(val).toBe('dark')
  })
})

describe('clearUserData', () => {
  it('removes all blocks and queue for a user', async () => {
    await putBlocks([makeRecord('b1', 0, 60, { user_id: userId })])
    await enqueueSyncAction({ action: 'upsert', table: 'blocks', record_id: 'b1' })
    await clearUserData(userId)
    const blocks = await db.blocks.count()
    expect(blocks).toBe(0)
    const queue = await db.sync_queue.count()
    expect(queue).toBe(0)
  })

  it('leaves other users data intact', async () => {
    await putBlocks([makeRecord('b1', 0, 60, { user_id: userId })])
    await putBlocks([makeRecord('b2', 120, 30, { user_id: 'other-user' })])
    await clearUserData(userId)
    const remaining = await db.blocks.count()
    expect(remaining).toBe(1)
  })
})

describe('checkHealth', () => {
  it('returns ok for healthy db', async () => {
    const result = await checkHealth()
    expect(result.ok).toBe(true)
  })
})

describe('estimateQuota', () => {
  it('returns supported info or unsupported flag', async () => {
    const result = await estimateQuota()
    expect('supported' in result).toBe(true)
  })
})
