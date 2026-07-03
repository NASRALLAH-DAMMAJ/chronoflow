import { useRef, useCallback, useState } from 'react'
import { SNAP_MINUTES } from '../../store/constants'
import { toWorldMinute, toRenderMinute, isVisible } from './zoom-utils'

function snap(minutes) {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES
}

function angleToMinutes(angle) {
  return (((angle + Math.PI / 2) / (2 * Math.PI)) * 1440 + 1440) % 1440
}

function angleDiff(a1, a2) {
  let d = a1 - a2
  while (d > Math.PI) d -= 2 * Math.PI
  while (d < -Math.PI) d += 2 * Math.PI
  return Math.abs(d)
}

export function useDialInteraction({ blocks, onMoveBlock, onResizeBlock, onResizeBlockStart, onSelectBlock, zoomRange, snapEnabled = true, disabled = false }) {
  const dragRef = useRef(null)
  const ghostRef = useRef(null)
  const [tick, setTick] = useState(0)

  function pointerToWorldMinutes(x, y, cx, cy) {
    const renderMin = angleToMinutes(Math.atan2(y - cy, x - cx))
    return toWorldMinute(renderMin, zoomRange)
  }

  function getBlockHit(x, y, cx, cy, innerR, outerR) {
    const dx = x - cx
    const dy = y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < innerR || dist > outerR) return null

    const pointerAngle = Math.atan2(dy, dx)
    const pointerMinutes = pointerToWorldMinutes(x, y, cx, cy)

    let bestEdgeHit = null
    let minEdgeDiff = Infinity
    const edgeThreshold = 0.12

    for (const block of blocks) {
      const start = block.start
      const end = block.end

      if (isVisible(start, zoomRange)) {
        const renderStart = toRenderMinute(start, zoomRange)
        const startAngle = (renderStart / 1440) * 2 * Math.PI - Math.PI / 2
        const diff = angleDiff(pointerAngle, startAngle)
        if (diff < edgeThreshold && diff < minEdgeDiff) {
          minEdgeDiff = diff
          bestEdgeHit = { block, edge: 'start' }
        }
      }

      if (isVisible(end, zoomRange)) {
        const renderEnd = toRenderMinute(end, zoomRange)
        const endAngle = (renderEnd / 1440) * 2 * Math.PI - Math.PI / 2
        const diff = angleDiff(pointerAngle, endAngle)
        if (diff < edgeThreshold && diff < minEdgeDiff) {
          minEdgeDiff = diff
          bestEdgeHit = { block, edge: 'end' }
        }
      }
    }

    if (bestEdgeHit) {
      return bestEdgeHit
    }

    for (const block of blocks) {
      const start = block.start
      const end = block.end
      const wraps = end <= start

      const inBlock = wraps
        ? (pointerMinutes >= start || pointerMinutes <= end)
        : (pointerMinutes >= start && pointerMinutes <= end)

      if (inBlock) {
        return { block, edge: 'body' }
      }
    }

    return null
  }

  const handlePointerDown = useCallback((e) => {
    if (disabled) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const radius = Math.min(cx, cy) - 20
    const innerR = radius * 0.6
    const outerR = radius

    const hit = getBlockHit(x, y, cx, cy, innerR, outerR)
    if (!hit) {
      onSelectBlock(null)
      return
    }

    onSelectBlock(hit.block.id)
    const wm = pointerToWorldMinutes(x, y, cx, cy)
    dragRef.current = {
      ...hit,
      ptrWorldMinutes: wm,
      continuousWm: wm,
      offset: wm - hit.block.start,
      cx, cy, outerR, innerR,
    }
    ghostRef.current = null
    setTick(t => t + 1)
  }, [blocks, onSelectBlock, zoomRange, disabled])

  const handlePointerMove = useCallback((e) => {
    const df = dragRef.current
    if (!df) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const { block, edge, cx, cy, outerR, offset, innerR, continuousWm } = df

    const dx = x - cx
    const dy = y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < innerR || dist > outerR) return

    const wm = pointerToWorldMinutes(x, y, cx, cy)
    let cw = wm
    if (continuousWm - wm > 720) cw = wm + 1440
    else if (wm - continuousWm > 720) cw = wm - 1440
    df.continuousWm = cw

    const snapped = snapEnabled ? snap(cw) : cw

    let g = null
    if (edge === 'body') {
      const wraps = block.end <= block.start
      const duration = wraps ? (block.end + 1440 - block.start) : (block.end - block.start)
      let newStart = snapped - offset
      const displayStart = ((newStart % 1440) + 1440) % 1440
      g = { ...block, start: Math.round(displayStart), end: Math.round(((displayStart + duration) % 1440 + 1440) % 1440 || 1440) }
    } else if (edge === 'end') {
      const displayEnd = ((snapped % 1440) + 1440) % 1440 || 1440
      if (displayEnd === block.start) {
        g = { ...block, end: Math.round(block.start + SNAP_MINUTES > 1440 ? SNAP_MINUTES : block.start + SNAP_MINUTES) }
      } else {
        g = { ...block, end: Math.round(displayEnd) }
      }
    } else if (edge === 'start') {
      const displayStart = ((snapped % 1440) + 1440) % 1440
      if (displayStart === block.end) {
        g = { ...block, start: Math.round(block.end - SNAP_MINUTES < 0 ? block.end + 1440 - SNAP_MINUTES : block.end - SNAP_MINUTES) }
      } else {
        g = { ...block, start: Math.round(displayStart) }
      }
    }

    ghostRef.current = g
    setTick(t => t + 1)
  }, [snapEnabled, zoomRange])

  const handlePointerUp = useCallback(() => {
    const df = dragRef.current
    if (!df) return
    dragRef.current = null
    const g = ghostRef.current
    ghostRef.current = null
    if (g) {
      if (df.edge === 'body') onMoveBlock(df.block.id, Math.round(g.start))
      else if (df.edge === 'end') onResizeBlock(df.block.id, Math.round(g.end))
      else if (df.edge === 'start') onResizeBlockStart(df.block.id, Math.round(g.start))
    }
    setTick(t => t + 1)
  }, [onMoveBlock, onResizeBlock, onResizeBlockStart])

  return {
    ghost: ghostRef.current,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerUp,
    },
  }
}
