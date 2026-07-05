const ERROR_QUEUE_KEY = 'chronoflow_errors'
const MAX_ERRORS = 50

export function captureError(error, context = {}) {
  const entry = {
    id: crypto.randomUUID?.() || Date.now().toString(36),
    message: error?.message || String(error),
    stack: error?.stack || '',
    url: window.location.href,
    timestamp: new Date().toISOString(),
    ...context,
  }

  try {
    const errors = JSON.parse(localStorage.getItem(ERROR_QUEUE_KEY) || '[]')
    errors.push(entry)
    if (errors.length > MAX_ERRORS) errors.splice(0, errors.length - MAX_ERRORS)
    localStorage.setItem(ERROR_QUEUE_KEY, JSON.stringify(errors))
  } catch {}

  if (import.meta.env.DEV) {
    console.error('[ChronoFlow Error]', entry.message, entry)
  }

  return entry
}

export function getQueuedErrors() {
  try {
    return JSON.parse(localStorage.getItem(ERROR_QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

export function clearQueuedErrors() {
  try { localStorage.removeItem(ERROR_QUEUE_KEY) } catch {}
}

export function getPerformanceMetrics() {
  const perf = performance
  const nav = perf.getEntriesByType?.('navigation')?.[0]
  const paint = perf.getEntriesByType?.('paint') || []

  return {
    loadTime: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
    domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
    firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || null,
    firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || null,
    memoryUsed: perf.memory?.usedJSHeapSize ? Math.round(perf.memory.usedJSHeapSize / 1024 / 1024) : null,
    timestamp: new Date().toISOString(),
  }
}

export async function healthCheck(supabase) {
  const results = { ok: true, checks: {} }

  try {
    const start = performance.now()
    const { error } = await supabase.from('blocks').select('id').limit(1)
    results.checks.db = { ok: !error, latency: Math.round(performance.now() - start) }
    if (error) results.ok = false
  } catch (e) {
    results.checks.db = { ok: false, error: e.message }
    results.ok = false
  }

  results.checks.auth = { ok: !!supabase.auth.getUser() }
  results.checks.offline = { ok: navigator.onLine }
  if (!navigator.onLine) results.ok = false

  return results
}
