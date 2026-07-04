import { describe, it, expect } from 'vitest'
import { minutesToStr, formatDuration, snapToGrid, formatDate } from '../utils'

describe('minutesToStr', () => {
  it('formats midnight', () => {
    expect(minutesToStr(0)).toBe('00:00')
  })
  it('formats noon', () => {
    expect(minutesToStr(720)).toBe('12:00')
  })
  it('formats 13:45', () => {
    expect(minutesToStr(825)).toBe('13:45')
  })
  it('handles wraparound (1500 = 01:00)', () => {
    expect(minutesToStr(1500)).toBe('01:00')
  })
})

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(30)).toBe('30m')
  })
  it('formats hours only', () => {
    expect(formatDuration(120)).toBe('2h')
  })
  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m')
  })
})

describe('snapToGrid', () => {
  it('snaps to nearest 5', () => {
    expect(snapToGrid(3)).toBe(5)
    expect(snapToGrid(7)).toBe(5)
    expect(snapToGrid(8)).toBe(10)
  })
  it('snaps exact values', () => {
    expect(snapToGrid(5)).toBe(5)
    expect(snapToGrid(30)).toBe(30)
  })
})

describe('formatDate', () => {
  it('formats date correctly', () => {
    const d = new Date(2026, 0, 15)
    expect(formatDate(d)).toBe('2026-01-15')
  })
  it('pads single digits', () => {
    const d = new Date(2026, 2, 5)
    expect(formatDate(d)).toBe('2026-03-05')
  })
})
