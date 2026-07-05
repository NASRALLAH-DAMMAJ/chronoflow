const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_BASE_DELAY_MS = 500

export async function withRetry(fn, options = {}) {
  const {
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
    onRetry,
  } = options

  let lastError
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (isAuthError(err)) throw err
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1)
        if (onRetry) onRetry({ attempt, error: err, delay })
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }
  throw lastError
}

export function isNetworkError(error) {
  if (!error) return false
  const msg = error.message?.toLowerCase() || ''
  return (
    error.code === 'NETWORK_ERROR' ||
    error.name === 'TypeError' && msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('load failed') ||
    msg.includes('networkerror') ||
    !navigator.onLine
  )
}

export function isAuthError(error) {
  if (!error) return false
  const status = error.status || error.statusCode || error?.context?.response?.status
  return status === 401 || status === 403
}
