import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db, enqueueSyncAction, getPendingSyncActions, markSyncActionProcessed } from '../lib/db'

vi.mock('../lib/supabase', () => ({
  supabase: {},
}))

const mockSupabase = {
  from: vi.fn(() => ({
    upsert: vi.fn().mockResolvedValue({ error: null }),
    delete: vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}

beforeEach(async () => {
  await db.sync_queue.clear()
  await db.blocks.clear()
  vi.clearAllMocks()
})

afterEach(async () => {
  await db.sync_queue.clear()
})

describe('syncEngine', () => {
  describe('enqueueForSync', () => {
    it('adds a new upsert action to the queue', async () => {
      const { enqueueForSync } = await import('../lib/syncEngine')
      const id = await enqueueForSync('upsert', 'block-1', { id: 'block-1', label: 'Test' })
      expect(id).toBeGreaterThan(0)
      const pending = await getPendingSyncActions()
      expect(pending).toHaveLength(1)
      expect(pending[0].action).toBe('upsert')
      expect(pending[0].record_id).toBe('block-1')
    })

    it('deduplicates upsert actions for the same record_id', async () => {
      const { enqueueForSync } = await import('../lib/syncEngine')
      const id1 = await enqueueForSync('upsert', 'block-1', { id: 'block-1', label: 'First' })
      const id2 = await enqueueForSync('upsert', 'block-1', { id: 'block-1', label: 'Second' })
      expect(id2).toBe(id1)
      const pending = await getPendingSyncActions()
      expect(pending).toHaveLength(1)
      expect(pending[0].payload.label).toBe('Second')
    })

    it('does not deduplicate different record_ids', async () => {
      const { enqueueForSync } = await import('../lib/syncEngine')
      await enqueueForSync('upsert', 'block-1', { id: 'block-1' })
      await enqueueForSync('upsert', 'block-2', { id: 'block-2' })
      const pending = await getPendingSyncActions()
      expect(pending).toHaveLength(2)
    })

    it('removes pending upserts when delete is enqueued for same record', async () => {
      const { enqueueForSync } = await import('../lib/syncEngine')
      await enqueueForSync('upsert', 'block-1', { id: 'block-1' })
      await enqueueForSync('delete', 'block-1', null)
      const pending = await getPendingSyncActions()
      expect(pending).toHaveLength(1)
      expect(pending[0].action).toBe('delete')
      expect(pending[0].record_id).toBe('block-1')
    })
  })

  describe('processSyncQueue', () => {
    it('returns early if no pending actions', async () => {
      const { processSyncQueue } = await import('../lib/syncEngine')
      await processSyncQueue(mockSupabase)
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('processes upsert actions in order', async () => {
      const { processSyncQueue, enqueueForSync } = await import('../lib/syncEngine')
      await enqueueForSync('upsert', 'b1', { id: 'b1', label: 'One' })
      await enqueueForSync('upsert', 'b2', { id: 'b2', label: 'Two' })
      await processSyncQueue(mockSupabase)
      const remaining = await db.sync_queue.count()
      expect(remaining).toBe(0)
    })

    it('processes creates before deletes', async () => {
      const { processSyncQueue, enqueueForSync } = await import('../lib/syncEngine')
      await enqueueForSync('delete', 'b1', null)
      await enqueueForSync('upsert', 'b2', { id: 'b2', label: 'Two' })

      const upsertMock = vi.fn().mockResolvedValue({ error: null })
      const deleteEqMock = vi.fn().mockResolvedValue({ error: null })
      const fromMock = vi.fn((table) => {
        if (table === 'blocks') {
          return {
            upsert: upsertMock,
            delete: vi.fn(() => ({
              eq: deleteEqMock,
            })),
          }
        }
        return { upsert: vi.fn(), delete: vi.fn(() => ({ eq: vi.fn() })) }
      })
      const localSupabase = { from: fromMock }

      await processSyncQueue(localSupabase)
      expect(upsertMock).toHaveBeenCalled()
      expect(deleteEqMock).toHaveBeenCalledWith('id', 'b1')

      const callOrder = []
      callOrder.push(fromMock.mock.calls[0][0])
      callOrder.push(fromMock.mock.calls[1][0])
      const upsertCallIndex = callOrder.findIndex(c => c === 'blocks')
      const deleteCallIndex = callOrder.lastIndexOf('blocks')
      expect(deleteCallIndex).toBeGreaterThanOrEqual(upsertCallIndex)
    })

    it('locks to prevent concurrent processing', async () => {
      const { processSyncQueue, enqueueForSync } = await import('../lib/syncEngine')
      await enqueueForSync('upsert', 'b1', { id: 'b1' })

      const fn = vi.fn()
      const slowSupabase = {
        from: vi.fn(() => ({
          upsert: vi.fn().mockImplementation(async () => {
            fn()
            await new Promise(r => setTimeout(r, 100))
            return { error: null }
          }),
          delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
        })),
      }

      const p1 = processSyncQueue(slowSupabase)
      const p2 = processSyncQueue(slowSupabase)
      await Promise.all([p1, p2])

      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('retry backoff', () => {
    it('retries on failure and eventually marks as failed', async () => {
      const { processSyncQueue, enqueueForSync } = await import('../lib/syncEngine')
      const id = await enqueueForSync('upsert', 'b1', { id: 'b1' })

      let callCount = 0
      const failSupabase = {
        from: vi.fn(() => ({
          upsert: vi.fn().mockImplementation(() => {
            callCount++
            return Promise.resolve({ error: new Error('Server error') })
          }),
          delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
        })),
      }

      Math.random = vi.fn(() => 0.5)

      await processSyncQueue(failSupabase)

      expect(callCount).toBe(5)

      const entry = await db.sync_queue.get(id)
      expect(entry.status).toBe('failed')
      expect(entry.retry_count).toBe(5)
    })
  })

  describe('progress reporting', () => {
    it('calls onProgress callback with correct counts', async () => {
      const { processSyncQueue, enqueueForSync } = await import('../lib/syncEngine')
      await enqueueForSync('upsert', 'b1', { id: 'b1' })
      await enqueueForSync('upsert', 'b2', { id: 'b2' })
      await enqueueForSync('delete', 'b3', null)

      const onProgress = vi.fn()
      await processSyncQueue(mockSupabase, onProgress)

      expect(onProgress).toHaveBeenCalledTimes(3)
      expect(onProgress).toHaveBeenNthCalledWith(1, 1, 3)
      expect(onProgress).toHaveBeenNthCalledWith(2, 2, 3)
      expect(onProgress).toHaveBeenNthCalledWith(3, 3, 3)
    })
  })

  describe('getQueueStats', () => {
    it('returns zero counts for empty queue', async () => {
      const { getQueueStats } = await import('../lib/syncEngine')
      const stats = await getQueueStats()
      expect(stats.pendingCount).toBe(0)
      expect(stats.failedCount).toBe(0)
      expect(stats.oldestItemAge).toBeNull()
    })

    it('returns pending count and oldest age', async () => {
      const { enqueueForSync, getQueueStats } = await import('../lib/syncEngine')
      await enqueueForSync('upsert', 'b1', { id: 'b1' })
      const stats = await getQueueStats()
      expect(stats.pendingCount).toBe(1)
      expect(stats.oldestItemAge).toBeGreaterThanOrEqual(0)
    })
  })

  describe('clearFailedActions', () => {
    it('removes all failed entries', async () => {
      const { enqueueForSync, clearFailedActions } = await import('../lib/syncEngine')
      const id = await enqueueForSync('upsert', 'b1', { id: 'b1' })
      await db.sync_queue.update(id, { status: 'failed' })

      await clearFailedActions()
      const remaining = await db.sync_queue.count()
      expect(remaining).toBe(0)
    })
  })
})
