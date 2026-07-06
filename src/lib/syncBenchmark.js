const isDev = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
)

let _totalDuration = 0
let _totalCalls = 0
let _maxDuration = 0
let _queueSize = 0

export function measureSyncDuration(fn) {
  return async (...args) => {
    const start = performance.now()
    try {
      const result = await fn(...args)
      const duration = performance.now() - start
      _totalDuration += duration
      _totalCalls++
      if (duration > _maxDuration) _maxDuration = duration
      if (isDev) {
        console.log(`[syncBenchmark] ${fn.name || 'anonymous'} took ${duration.toFixed(1)}ms`)
      }
      return result
    } catch (err) {
      const duration = performance.now() - start
      if (isDev) {
        console.warn(`[syncBenchmark] ${fn.name || 'anonymous'} failed after ${duration.toFixed(1)}ms`, err)
      }
      throw err
    }
  }
}

export function trackQueueSize(size) {
  _queueSize = size
}

export function getSyncMetrics() {
  return {
    totalCalls: _totalCalls,
    totalDurationMs: Math.round(_totalDuration),
    averageMs: _totalCalls > 0 ? Math.round(_totalDuration / _totalCalls) : 0,
    maxDurationMs: Math.round(_maxDuration),
    currentQueueSize: _queueSize,
  }
}

export function resetSyncMetrics() {
  _totalDuration = 0
  _totalCalls = 0
  _maxDuration = 0
  _queueSize = 0
}
