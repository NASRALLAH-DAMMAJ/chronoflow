import { describe, it, expect } from 'vitest'
import { validateBlockForDb, blockToDb, blockFromDb } from '../lib/blocks'
import { MINUTES_IN_DAY } from '../store/constants'

describe('validateBlockForDb', () => {
  it('returns null for valid block', () => {
    const block = { id: 'b1', start: 0, end: 60, label: 'Work', category: 'work' }
    expect(validateBlockForDb(block)).toBeNull()
  })

  it('returns error for null block', () => {
    expect(validateBlockForDb(null)).toBe('Block is required')
  })

  it('returns error for empty label', () => {
    const block = { id: 'b1', start: 0, end: 60, label: '', category: 'work' }
    expect(validateBlockForDb(block)).toBe('Label is required')
  })

  it('returns error for whitespace-only label', () => {
    const block = { id: 'b1', start: 0, end: 60, label: '   ', category: 'work' }
    expect(validateBlockForDb(block)).toBe('Label is required')
  })

  it('returns error for label over 100 chars', () => {
    const block = { id: 'b1', start: 0, end: 60, label: 'x'.repeat(101), category: 'work' }
    expect(validateBlockForDb(block)).toBe('Label must be 100 characters or less')
  })

  it('returns error for invalid category', () => {
    const block = { id: 'b1', start: 0, end: 60, label: 'Work', category: 'invalid' }
    expect(validateBlockForDb(block)).toContain('Invalid category')
  })

  it('returns error for start out of range', () => {
    const block = { id: 'b1', start: -1, end: 60, label: 'Work', category: 'work' }
    expect(validateBlockForDb(block)).toContain('Invalid start')
  })

  it('returns error for start >= 1440', () => {
    const block = { id: 'b1', start: 1440, end: 1500, label: 'Work', category: 'work' }
    expect(validateBlockForDb(block)).toContain('Invalid start')
  })

  it('returns error for end > 1440', () => {
    const block = { id: 'b1', start: 0, end: 1500, label: 'Work', category: 'work' }
    expect(validateBlockForDb(block)).toContain('Invalid end')
  })

  it('returns error for start === end', () => {
    const block = { id: 'b1', start: 60, end: 60, label: 'Work', category: 'work' }
    expect(validateBlockForDb(block)).toBe('Block must have a duration')
  })

  it('accepts midnight crossing block', () => {
    const block = { id: 'b1', start: 1300, end: 100, label: 'Sleep', category: 'sleep' }
    expect(validateBlockForDb(block)).toBeNull()
  })
})

describe('blockToDb', () => {
  it('converts block to DB format', () => {
    const block = { id: 'b1', start: 60, end: 120, label: 'Work', category: 'work' }
    const result = blockToDb(block, '2026-07-05', 'user-1')
    expect(result).toEqual({
      id: 'b1',
      user_id: 'user-1',
      date: '2026-07-05',
      start_min: 60,
      duration: 60,
      label: 'Work',
      category: 'work',
      is_recurring: false,
      parent_rule_id: null,
    })
  })

  it('calculates duration for wrapping block', () => {
    const block = { id: 'b2', start: 1380, end: 60, label: 'Sleep', category: 'sleep' }
    const result = blockToDb(block, '2026-07-05', 'user-1')
    expect(result.duration).toBe(120)
  })

  it('rounds start and duration', () => {
    const block = { id: 'b3', start: 62, end: 123, label: 'Work', category: 'work' }
    const result = blockToDb(block, '2026-07-05', 'user-1')
    expect(result.start_min).toBe(62)
    expect(result.duration).toBe(61)
  })

  it('includes locked field', () => {
    const block = { id: 'b4', start: 0, end: 60, label: 'Locked', category: 'work', locked: true }
    const result = blockToDb(block, '2026-07-05', 'user-1')
    expect(result.locked).toBeUndefined()
  })

  it('defaults locked to false', () => {
    const block = { id: 'b5', start: 0, end: 60, label: 'No lock', category: 'work' }
    const result = blockToDb(block, '2026-07-05', 'user-1')
    expect(result.locked).toBeUndefined()
  })

  it('throws on invalid duration', () => {
    const block = { id: 'b6', start: 60, end: 60, label: 'Bad', category: 'work' }
    const result = blockToDb(block, '2026-07-05', 'user-1')
    expect(result.duration).toBe(1440)
  })

  it('trims label', () => {
    const block = { id: 'b7', start: 0, end: 60, label: '  Work  ', category: 'work' }
    const result = blockToDb(block, '2026-07-05', 'user-1')
    expect(result.label).toBe('Work')
  })
})

describe('blockFromDb', () => {
  it('converts DB row to block', () => {
    const row = { id: 'b1', start_min: 60, duration: 60, label: 'Work', category: 'work', is_recurring: false, parent_rule_id: null, locked: false }
    const result = blockFromDb(row)
    expect(result).toEqual({
      id: 'b1',
      start: 60,
      end: 120,
      label: 'Work',
      category: 'work',
      is_recurring: false,
      parent_rule_id: null,
      locked: false,
    })
  })

  it('handles wrapping block', () => {
    const row = { id: 'b2', start_min: 1380, duration: 120, label: 'Sleep', category: 'sleep', is_recurring: false, parent_rule_id: null, locked: true }
    const result = blockFromDb(row)
    expect(result.start).toBe(1380)
    expect(result.end).toBe(60)
    expect(result.locked).toBe(true)
  })

  it('defaults locked to false if missing', () => {
    const row = { id: 'b3', start_min: 0, duration: 60, label: 'Work', category: 'work', is_recurring: false, parent_rule_id: null }
    const result = blockFromDb(row)
    expect(result.locked).toBe(false)
  })
})
