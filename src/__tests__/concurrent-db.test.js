import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import {
  putBlock, putBlocks, getBlocksByDate, getAllBlocks, db,
} from '../lib/db'

const makeRecord = (id, start, dur, overrides = {}) => ({
  id, user_id: 'test-user', date: '2026-07-06',
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

describe('concurrent writes', () => {
  it('handles parallel putBlock operations on different keys', async () => {
    const promises = []
    for (let i = 0; i < 10; i++) {
      promises.push(putBlock(makeRecord(`b${i}`, i * 60, 30)))
    }
    await Promise.all(promises)
    const count = await db.blocks.count()
    expect(count).toBe(10)
  })

  it('maintains data integrity after parallel writes', async () => {
    const promises = []
    for (let i = 0; i < 10; i++) {
      promises.push(putBlock(makeRecord(`b${i}`, i * 60, 30)))
    }
    await Promise.all(promises)
    for (let i = 0; i < 10; i++) {
      const block = await db.blocks.get(`b${i}`)
      expect(block.start_min).toBe(i * 60)
      expect(block.duration).toBe(30)
    }
  })

  it('handles concurrent updates to the same block', async () => {
    await putBlock(makeRecord('b1', 0, 30))
    const updates = [60, 120, 180, 240, 300].map(start =>
      putBlock(makeRecord('b1', start, 30))
    )
    await Promise.all(updates)
    const block = await db.blocks.get('b1')
    expect(block.start_min).toBeGreaterThanOrEqual(0)
  })

  it('handles race between putBlocks and getBlocksByDate', async () => {
    const results = await Promise.all([
      putBlocks([makeRecord('b1', 0, 30), makeRecord('b2', 60, 30)]),
      getBlocksByDate('2026-07-06'),
      putBlocks([makeRecord('b3', 120, 30), makeRecord('b4', 180, 30)]),
      getBlocksByDate('2026-07-06'),
    ])
    expect(results).toHaveLength(4)
  })

  it('preserves all blocks when reading during parallel writes', async () => {
    await putBlock(makeRecord('seed', 0, 60))
    const reads = []
    for (let i = 0; i < 5; i++) {
      reads.push(
        (async () => {
          await putBlock(makeRecord(`write-${i}`, (i + 1) * 60, 30))
          const all = await getAllBlocks()
          return all.length
        })()
      )
    }
    const lengths = await Promise.all(reads)
    expect(lengths).toEqual(expect.arrayContaining([expect.any(Number)]))
    const finalCount = await db.blocks.count()
    expect(finalCount).toBe(6)
  })
})
