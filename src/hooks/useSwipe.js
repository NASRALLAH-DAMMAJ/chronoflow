import { useRef, useCallback } from 'react'

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 } = {}) {
  const touchStart = useRef(null)

  const onTouchStart = useCallback((e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])

  const onTouchEnd = useCallback((e) => {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    touchStart.current = null
    if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return
    if (dx > 0) onSwipeRight?.()
    else onSwipeLeft?.()
  }, [onSwipeLeft, onSwipeRight, threshold])

  return { onTouchStart, onTouchEnd }
}

export function haptic(style = 'light') {
  if (!navigator.vibrate) return
  switch (style) {
    case 'light': navigator.vibrate(10); break
    case 'medium': navigator.vibrate(20); break
    case 'heavy': navigator.vibrate(40); break
    case 'error': navigator.vibrate([30, 50, 30]); break
    case 'success': navigator.vibrate([10, 30, 10]); break
  }
}
