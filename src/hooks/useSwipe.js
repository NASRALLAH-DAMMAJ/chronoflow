import { useRef, useCallback } from 'react'
import { haptic } from '../lib/haptics'

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
    haptic('light')
    if (dx > 0) onSwipeRight?.()
    else onSwipeLeft?.()
  }, [onSwipeLeft, onSwipeRight, threshold])

  return { onTouchStart, onTouchEnd }
}

export { haptic } from '../lib/haptics'
