import { useRef, useCallback, useEffect } from 'react'
import { MINUTES_IN_DAY, DIAL, SNAP_MINUTES } from '../store/constants'
import { toWorldMinute } from '../components/Dial/zoom-utils'
import { haptic } from './useSwipe'

function angleToMinutes(angle) {
  return (((angle + Math.PI / 2) / (2 * Math.PI)) * MINUTES_IN_DAY + MINUTES_IN_DAY) % MINUTES_IN_DAY
}

function getTouchCenter(t1, t2) {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t2.clientY + t2.clientY) / 2,
  }
}

function getTouchDistance(t1, t2) {
  const dx = t1.clientX - t2.clientX
  const dy = t1.clientY - t2.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function getTouchAngle(centerX, centerY, touchX, touchY) {
  return Math.atan2(touchY - centerY, touchX - centerX)
}

function distFromCenter(px, py, cx, cy) {
  const dx = px - cx
  const dy = py - cy
  return Math.sqrt(dx * dx + dy * dy)
}

export function useDialGesture({
  blocks,
  onSelectBlock,
  onAddBlock,
  onLongPressBlock,
  zoomRange,
  containerRef,
  disabled = false,
}) {
  const touchState = useRef({
    startTouches: null,
    startDistance: 0,
    startAngle: 0,
    startTime: 0,
    lastTapTime: 0,
    longPressTimer: null,
    isPinching: false,
    isRotating: false,
    hasMoved: false,
  })

  const clearLongPress = useCallback(() => {
    const ts = touchState.current
    if (ts.longPressTimer) {
      clearTimeout(ts.longPressTimer)
      ts.longPressTimer = null
    }
  }, [])

  const findBlockAtPosition = useCallback((x, y) => {
    if (!containerRef?.current) return null
    const rect = containerRef.current.getBoundingClientRect()
    const px = x - rect.left
    const py = y - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const radius = Math.min(cx, cy) - DIAL.CANVAS_PADDING
    const innerR = radius * DIAL.INNER_RADIUS_RATIO
    const dist = distFromCenter(px, py, cx, cy)

    if (dist < innerR || dist > radius) return null

    const dx = px - cx
    const dy = py - cy
    const angle = Math.atan2(dy, dx)
    const renderMin = angleToMinutes(angle)
    const worldMin = toWorldMinute(renderMin, zoomRange)

    for (const block of blocks) {
      const { start, end } = block
      const inBlock = end <= start
        ? (worldMin >= start || worldMin <= end)
        : (worldMin >= start && worldMin <= end)
      if (inBlock) return block
    }
    return null
  }, [blocks, zoomRange, containerRef])

  const handleTouchStart = useCallback((e) => {
    if (disabled) return
    const ts = touchState.current

    if (e.touches.length === 2) {
      clearLongPress()
      ts.isPinching = true
      ts.startTouches = [e.touches[0], e.touches[1]]
      const center = getTouchCenter(e.touches[0], e.touches[1])
      ts.startDistance = getTouchDistance(e.touches[0], e.touches[1])
      ts.startAngle = getTouchAngle(center.x, center.y, e.touches[0].clientX, e.touches[0].clientY)
      e.preventDefault()
      return
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0]
      ts.startTime = Date.now()
      ts.hasMoved = false
      ts.startTouches = [touch]
      ts.isPinching = false

      const block = findBlockAtPosition(touch.clientX, touch.clientY)

      clearLongPress()
      ts.longPressTimer = setTimeout(() => {
        if (!ts.hasMoved) {
          if (block && onLongPressBlock) {
            haptic('heavy')
            onLongPressBlock(block)
          }
        }
      }, 500)
    }
  }, [disabled, findBlockAtPosition, onLongPressBlock, clearLongPress])

  const handleTouchMove = useCallback((e) => {
    const ts = touchState.current

    if (ts.isPinching && e.touches.length === 2) {
      e.preventDefault()
      return
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0]
      if (ts.startTouches?.[0]) {
        const dx = touch.clientX - ts.startTouches[0].clientX
        const dy = touch.clientY - ts.startTouches[0].clientY
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
          ts.hasMoved = true
          clearLongPress()
        }
      }
    }
  }, [clearLongPress])

  const handleTouchEnd = useCallback((e) => {
    const ts = touchState.current
    clearLongPress()

    if (ts.isPinching) {
      if (e.touches.length < 2) {
        ts.isPinching = false
        ts.startTouches = null
      }
      return
    }

    if (ts.startTouches?.[0] && !ts.hasMoved && e.changedTouches?.[0]) {
      const elapsed = Date.now() - ts.startTime
      if (elapsed < 300) {
        const touch = e.changedTouches[0]
        const block = findBlockAtPosition(touch.clientX, touch.clientY)

        if (block) {
          onSelectBlock?.(block.id)
          haptic('light')
        } else if (onAddBlock && containerRef?.current) {
          const rect = containerRef.current.getBoundingClientRect()
          const px = touch.clientX - rect.left
          const py = touch.clientY - rect.top
          const cx = rect.width / 2
          const cy = rect.height / 2
          const radius = Math.min(cx, cy) - DIAL.CANVAS_PADDING
          const innerR = radius * DIAL.INNER_RADIUS_RATIO
          const dist = distFromCenter(px, py, cx, cy)

          if (dist >= innerR && dist <= radius) {
            const dx = px - cx
            const dy = py - cy
            const angle = Math.atan2(dy, dx)
            const renderMin = angleToMinutes(angle)
            const worldMin = toWorldMinute(renderMin, zoomRange)
            const snapped = Math.round(worldMin / SNAP_MINUTES) * SNAP_MINUTES
            const start = ((snapped % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY
            const end = (start + SNAP_MINUTES) % MINUTES_IN_DAY || MINUTES_IN_DAY

            haptic('success')
            onAddBlock(start, end)
          }
        }
      }
    }

    ts.startTouches = null
    ts.hasMoved = false
  }, [findBlockAtPosition, onSelectBlock, onAddBlock, zoomRange, containerRef, clearLongPress])

  useEffect(() => {
    return () => clearLongPress()
  }, [clearLongPress])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }
}
