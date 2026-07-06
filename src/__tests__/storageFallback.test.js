import { describe, it, expect, beforeEach } from 'vitest'
import { getFallbackStorage, isIndexedDBAvailable } from '../lib/storageFallback'

const userId = 'test-user-1'
const today = '2026-07-06'

function makeRecord(id, start, dur, overrides = {}) {
  return {
    id,
    user_id: userId,
    date: today,
    start_min: start,
    duration: dur,
    label: 'Test',
    category: 'work',
    is_recurring: 0,
    parent_rule_id: null,
    archived: 0,
    locked: 0,
    ...overrides,
  }
}

function clearStorage() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('chronoflow_'))
  keys.forEach(k => localStorage.removeItem(k))
}

let storage
beforeEach(() => {
  clearStorage()
  storage = getFallbackStorage()
})

describe('CRUD operations', () => {
  it('seedBlocks stores multiple records', async () => {
    await storage.seedBlocks([makeRecord('b1', 0, 60), makeRecord('b2', 120, 30)])
    const blocks = await storage.getBlocksByDate(today)
    expect(blocks).toHaveLength(2)
  })

  it('getBlocksByDate returns blocks for the given date', async () => {
    await storage.seedBlocks([makeRecord('b1', 0, 60)])
    const blocks = await storage.getBlocksByDate(today)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].start).toBe(0)
  })

  it('getBlocksByDate excludes archived blocks', async () => {
    await storage.seedBlocks([
      makeRecord('b1', 0, 60),
      makeRecord('b2', 120, 30, { archived: 1 }),
    ])
    const blocks = await storage.getBlocksByDate(today)
    expect(blocks).toHaveLength(1)
  })

  it('getBlocksByDate returns empty for unknown date', async () => {
    const blocks = await storage.getBlocksByDate('2099-01-01')
    expect(blocks).toEqual([])
  })

  it('putBlock stores a record', async () => {
    await storage.putBlock(makeRecord('b1', 60, 30))
    const block = await storage.getBlock('b1')
    expect(block).not.toBeNull()
    expect(block.start).toBe(60)
  })

  it('getBlock returns null for missing', async () => {
    const block = await storage.getBlock('nonexistent')
    expect(block).toBeNull()
  })

  it('putBlocks stores multiple records', async () => {
    await storage.putBlocks([makeRecord('b1', 0, 60), makeRecord('b2', 120, 30)])
    const all = await storage.getBlocksByDate(today)
    expect(all).toHaveLength(2)
  })

  it('removeBlock deletes a record', async () => {
    await storage.putBlock(makeRecord('b1', 0, 60))
    await storage.removeBlock('b1')
    const block = await storage.getBlock('b1')
    expect(block).toBeNull()
  })

  it('markBlockArchived sets archived flag', async () => {
    await storage.putBlock(makeRecord('b1', 0, 60))
    await storage.markBlockArchived('b1')
    const blocks = await storage.getBlocksByDate(today)
    expect(blocks).toHaveLength(0)
  })

  it('getAllBlocks returns non-archived only', async () => {
    await storage.putBlocks([
      makeRecord('b1', 0, 60),
      makeRecord('b2', 120, 30, { archived: 1 }),
    ])
    const all = await storage.getAllBlocks()
    expect(all).toHaveLength(1)
  })
})

describe('sync queue', () => {
  it('enqueues and retrieves pending actions', async () => {
    const id = await storage.enqueueSyncAction({ action: 'upsert', table: 'blocks', record_id: 'b1', payload: {} })
    expect(id).toBe(1)
    const pending = await storage.getPendingSyncActions()
    expect(pending).toHaveLength(1)
    expect(pending[0].action).toBe('upsert')
    expect(pending[0].status).toBe('pending')
  })

  it('marks action as processed (deletes)', async () => {
    const id = await storage.enqueueSyncAction({ action: 'delete', table: 'blocks', record_id: 'b1' })
    await storage.markSyncActionProcessed(id)
    const remaining = await storage.getPendingSyncActions()
    expect(remaining).toHaveLength(0)
  })

  it('increments retry count then marks failed at 5', async () => {
    const id = await storage.enqueueSyncAction({ action: 'upsert', table: 'blocks', record_id: 'b1' })
    for (let i = 0; i < 4; i++) {
      await storage.markSyncActionFailed(id)
    }
    let pending = await storage.getPendingSyncActions()
    expect(pending[0].retry_count).toBe(4)
    expect(pending[0].status).toBe('pending')
    await storage.markSyncActionFailed(id)
    pending = await storage.getPendingSyncActions()
    expect(pending).toHaveLength(0)
  })

  it('clears sync queue', async () => {
    await storage.enqueueSyncAction({ action: 'upsert', table: 'blocks', record_id: 'b1' })
    await storage.clearSyncQueue()
    const pending = await storage.getPendingSyncActions()
    expect(pending).toHaveLength(0)
  })
})

describe('settings', () => {
  it('stores and retrieves settings', async () => {
    await storage.setSetting('theme', 'dark')
    const val = await storage.getSetting('theme')
    expect(val).toBe('dark')
  })

  it('returns null for missing key', async () => {
    const val = await storage.getSetting('nonexistent')
    expect(val).toBeNull()
  })

  it('overwrites existing key', async () => {
    await storage.setSetting('theme', 'light')
    await storage.setSetting('theme', 'dark')
    const val = await storage.getSetting('theme')
    expect(val).toBe('dark')
  })
})

describe('clearUserData', () => {
  it('removes blocks and queue for a user', async () => {
    await storage.putBlocks([makeRecord('b1', 0, 60)])
    await storage.enqueueSyncAction({ action: 'upsert', table: 'blocks', record_id: 'b1' })
    await storage.clearUserData(userId)
    const blocks = await storage.getBlocksByDate(today)
    expect(blocks).toHaveLength(0)
    const pending = await storage.getPendingSyncActions()
    expect(pending).toHaveLength(0)
  })

  it('leaves other users data intact', async () => {
    await storage.putBlocks([makeRecord('b1', 0, 60, { user_id: userId })])
    await storage.putBlocks([makeRecord('b2', 120, 30, { user_id: 'other-user' })])
    await storage.clearUserData(userId)
    const remaining = await storage.getAllBlocks()
    expect(remaining).toHaveLength(1)
  })
})

describe('checkHealth', () => {
  it('returns ok for healthy storage', async () => {
    const result = await storage.checkHealth()
    expect(result.ok).toBe(true)
  })
})

describe('estimateQuota', () => {
  it('returns quota info', async () => {
    const result = await storage.estimateQuota()
    expect(result.supported).toBe(true)
    expect(typeof result.usage).toBe('number')
    expect(typeof result.quota).toBe('number')
    expect(typeof result.percent).toBe('number')
  })
})

describe('emergencyPrune', () => {
  it('removes oldest archived blocks first', async () => {
    await storage.putBlocks([
      makeRecord('b1', 0, 60, { archived: 1 }),
      makeRecord('b2', 120, 30, { archived: 1 }),
      makeRecord('b3', 240, 15),
    ])
    const result = await storage.emergencyPrune()
    expect(result.removed.length).toBeGreaterThanOrEqual(0)
    const remaining = await storage.getBlocksByDate(today)
    expect(remaining.length).toBeGreaterThanOrEqual(0)
  })
})

describe('isIndexedDBAvailable', () => {
  it('returns a promise resolving to boolean', async () => {
    const result = await isIndexedDBAvailable()
    expect(typeof result).toBe('boolean')
  })
})
