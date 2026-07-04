import { useRef, useCallback } from 'react'

const SWIPE_THRESHOLD = 50
const SWIPE_TIMEOUT = 300

export function useSwipe({ onSwipeLeft, onSwipeRight }) {
  const touchStart = useRef(null)
  const touchTime = useRef(null)

  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
    touchTime.current = Date.now()
  }, [])

  const onTouchEnd = useCallback((e) => {
    if (!touchStart.current) return
    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchStart.current.x
    const dy = touch.clientY - touchStart.current.y
    const dt = Date.now() - touchTime.current

    touchStart.current = null
    touchTime.current = null

    if (dt > SWIPE_TIMEOUT) return
    if (Math.abs(dx) < SWIPE_THRESHOLD) return
    if (Math.abs(dy) > Math.abs(dx)) return

    if (dx > 0 && onSwipeRight) onSwipeRight()
    else if (dx < 0 && onSwipeLeft) onSwipeLeft()
  }, [onSwipeLeft, onSwipeRight])

  return { onTouchStart, onTouchEnd }
}
