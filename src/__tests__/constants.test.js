import { describe, it, expect } from 'vitest'
import { getTodayStr, CATEGORY_COLORS, SNAP_MINUTES, HOURS, MINUTES_IN_DAY, BLOCK_CATEGORIES } from '../store/constants'

describe('getTodayStr', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = getTodayStr(new Date(2026, 0, 15))
    expect(result).toBe('2026-01-15')
  })

  it('pads month and day', () => {
    const result = getTodayStr(new Date(2026, 2, 5))
    expect(result).toBe('2026-03-05')
  })
})

describe('CATEGORY_COLORS', () => {
  it('has all categories from BLOCK_CATEGORIES', () => {
    for (const cat of BLOCK_CATEGORIES) {
      expect(CATEGORY_COLORS).toHaveProperty(cat)
    }
  })

  it('has exactly the categories from BLOCK_CATEGORIES', () => {
    expect(Object.keys(CATEGORY_COLORS).sort()).toEqual([...BLOCK_CATEGORIES].sort())
  })
})

describe('SNAP_MINUTES', () => {
  it('is 15', () => {
    expect(SNAP_MINUTES).toBe(15)
  })
})

describe('HOURS', () => {
  it('is 24', () => {
    expect(HOURS).toBe(24)
  })
})

describe('MINUTES_IN_DAY', () => {
  it('is 1440', () => {
    expect(MINUTES_IN_DAY).toBe(1440)
  })
})
