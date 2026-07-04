import { describe, it, expect, vi } from 'vitest'
import { withRetry, isNetworkError, isAuthError } from '../lib/retry'

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await withRetry(fn, { baseDelayMs: 1 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on failure and returns on success', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok')
    const result = await withRetry(fn, { baseDelayMs: 1 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws after max attempts exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'))
    await expect(withRetry(fn, { maxAttempts: 2, baseDelayMs: 1 }))
      .rejects.toThrow('fail')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('calls onRetry with attempt info', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('err1'))
      .mockResolvedValue('ok')
    const onRetry = vi.fn()
    await withRetry(fn, { baseDelayMs: 1, onRetry })
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onRetry).toHaveBeenCalledWith({
      attempt: 1,
      error: expect.objectContaining({ message: 'err1' }),
      delay: 1,
    })
  })

  it('uses exponential backoff delays', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('e1'))
      .mockRejectedValueOnce(new Error('e2'))
      .mockResolvedValue('ok')
    const onRetry = vi.fn()
    await withRetry(fn, { baseDelayMs: 10, onRetry })
    expect(onRetry.mock.calls[0][0].delay).toBe(10)
    expect(onRetry.mock.calls[1][0].delay).toBe(20)
  })
})

describe('isNetworkError', () => {
  it('returns true for fetch TypeError', () => {
    const err = new TypeError('Failed to fetch')
    expect(isNetworkError(err)).toBe(true)
  })

  it('returns true for NETWORK_ERROR code', () => {
    const err = { code: 'NETWORK_ERROR', message: '' }
    expect(isNetworkError(err)).toBe(true)
  })

  it('returns true when offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    const result = isNetworkError(new Error('whatever'))
    expect(result).toBe(true)
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  it('returns false for normal errors', () => {
    expect(isNetworkError(new Error('some error'))).toBe(false)
  })

  it('returns false for null', () => {
    expect(isNetworkError(null)).toBe(false)
  })
})

describe('isAuthError', () => {
  it('returns true for 401', () => {
    expect(isAuthError({ status: 401 })).toBe(true)
  })

  it('returns true for 403', () => {
    expect(isAuthError({ statusCode: 403 })).toBe(true)
  })

  it('returns false for 404', () => {
    expect(isAuthError({ status: 404 })).toBe(false)
  })

  it('returns false for null', () => {
    expect(isAuthError(null)).toBe(false)
  })
})
