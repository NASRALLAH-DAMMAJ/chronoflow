import { useRef, useCallback } from 'react'

export function useLongPress(callback, { delay = 500 } = {}) {
  const timerRef = useRef(null)
  const isLongPress = useRef(false)

  const start = useCallback((e) => {
    isLongPress.current = false
    timerRef.current = setTimeout(() => {
      isLongPress.current = true
      callback(e)
    }, delay)
  }, [callback, delay])

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchMove: stop,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
  }
}
