import { describe, it, expect } from 'vitest'
import {
  validateBlockLabel,
  validateBlockCategory,
  validateBlockTime,
  validateSleepTime,
  validateRuleLabel,
  validateRuleDays,
  validateRuleTime,
  validateBlock,
  validateSettings,
} from '../lib/validation'

describe('validateBlockLabel', () => {
  it('returns null for valid label', () => {
    expect(validateBlockLabel('Work')).toBeNull()
  })

  it('returns error for empty string', () => {
    expect(validateBlockLabel('')).toBe('Label is required')
  })

  it('returns error for whitespace only', () => {
    expect(validateBlockLabel('   ')).toBe('Label cannot be empty')
  })

  it('returns error for null', () => {
    expect(validateBlockLabel(null)).toBe('Label is required')
  })

  it('returns error for too long', () => {
    expect(validateBlockLabel('x'.repeat(101))).toBe('Label must be 100 characters or less')
  })

  it('trims and accepts 100 chars', () => {
    expect(validateBlockLabel('x'.repeat(100))).toBeNull()
  })
})

describe('validateBlockCategory', () => {
  it('returns null for valid category', () => {
    expect(validateBlockCategory('work')).toBeNull()
  })

  it('returns error for invalid category', () => {
    expect(validateBlockCategory('invalid')).toBe('Invalid category: invalid')
  })

  it('returns error for null', () => {
    expect(validateBlockCategory(null)).toBe('Category is required')
  })
})

describe('validateBlockTime', () => {
  it('returns null for valid range', () => {
    expect(validateBlockTime(0, 60)).toBeNull()
  })

  it('returns error for negative start', () => {
    expect(validateBlockTime(-1, 60)).toContain('Start must be')
  })

  it('returns error for start = 1440', () => {
    expect(validateBlockTime(1440, 1500)).toContain('Start must be')
  })

  it('returns error for end > 1440', () => {
    expect(validateBlockTime(0, 1500)).toContain('End must be')
  })

  it('returns error for equal start/end', () => {
    expect(validateBlockTime(60, 60)).toBe('Block must have a duration')
  })

  it('accepts midnight crossing (end < start)', () => {
    expect(validateBlockTime(1300, 100)).toBeNull()
  })
})

describe('validateSleepTime', () => {
  it('returns null for valid range', () => {
    expect(validateSleepTime(1320, 420)).toBeNull()
  })

  it('returns error for out of range', () => {
    expect(validateSleepTime(1500, 420)).toContain('Start must be')
  })
})

describe('validateRuleLabel', () => {
  it('returns null for valid label', () => {
    expect(validateRuleLabel('Morning routine')).toBeNull()
  })

  it('returns error for empty', () => {
    expect(validateRuleLabel('')).toBe('Label is required')
  })
})

describe('validateRuleDays', () => {
  it('returns null for valid days', () => {
    expect(validateRuleDays([1, 2, 3])).toBeNull()
  })

  it('returns error for empty array', () => {
    expect(validateRuleDays([])).toBe('Select at least one day')
  })

  it('returns error for invalid day', () => {
    expect(validateRuleDays([0, 8])).toBe('Days must be 0–6 (Sun–Sat)')
  })

  it('returns error for non-array', () => {
    expect(validateRuleDays('1,2')).toBe('Select at least one day')
  })
})

describe('validateRuleTime', () => {
  it('returns null for valid time', () => {
    expect(validateRuleTime(480, 60)).toBeNull()
  })

  it('returns error for negative start', () => {
    expect(validateRuleTime(-1, 60)).toContain('Start must be')
  })

  it('returns error for zero duration', () => {
    expect(validateRuleTime(480, 0)).toContain('Duration must be')
  })

  it('returns error for duration > 1440', () => {
    expect(validateRuleTime(480, 1500)).toContain('Duration must be')
  })
})

describe('validateBlock', () => {
  it('returns null for valid block', () => {
    expect(validateBlock({ label: 'Work', category: 'work', start: 0, end: 60 })).toBeNull()
  })

  it('returns first error found', () => {
    expect(validateBlock({ label: '', category: 'work', start: 0, end: 60 })).toBe('Label is required')
  })
})

describe('validateSettings', () => {
  it('returns null for valid settings', () => {
    expect(validateSettings({ sleepStart: 1320, sleepEnd: 420 })).toBeNull()
  })

  it('returns null when sleep times not set', () => {
    expect(validateSettings({})).toBeNull()
  })
})
