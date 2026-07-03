import { useRef, useCallback, useState } from 'react'
import { SNAP_MINUTES } from '../../store/constants'
import { toWorldMinute, toRenderMinute } from './zoom-utils'

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

export function useDialInteraction({ blocks, onMoveBlock, onResizeBlock, onSelectBlock, zoomRange, snapEnabled = true, disabled = false }) {
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

    for (const block of blocks) {
      const start = block.start
      const end = block.end
      const wraps = end <= start

      const inBlock = wraps
        ? (pointerMinutes >= start || pointerMinutes <= end)
        : (pointerMinutes >= start && pointerMinutes <= end)

      if (!inBlock) continue

      const renderStart = toRenderMinute(start, zoomRange)
      const renderEnd = toRenderMinute(end, zoomRange)
      const startAngle = (renderStart / 1440) * 2 * Math.PI - Math.PI / 2
      const endAngle = (renderEnd / 1440) * 2 * Math.PI - Math.PI / 2
      const edgeThreshold = 0.12

      if (angleDiff(pointerAngle, startAngle) < edgeThreshold) return { block, edge: 'start' }
      if (angleDiff(pointerAngle, endAngle) < edgeThreshold) return { block, edge: 'end' }
      return { block, edge: 'body' }
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
    const { block, edge, cx, cy, outerR, offset, innerR } = df

    const dx = x - cx
    const dy = y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < innerR || dist > outerR) return

    const wm = pointerToWorldMinutes(x, y, cx, cy)
    const snapped = snapEnabled ? snap(wm) : wm

    let g = null
    if (edge === 'body') {
      let newStart = snapped - offset
      if (newStart < 0) newStart = 0
      if (newStart > 1440) newStart = 1440
      const duration = block.end - block.start
      let newEnd = newStart + duration
      if (newEnd > 1440) { newEnd = 1440; newStart = 1440 - duration }
      g = { ...block, start: newStart, end: newEnd }
    } else if (edge === 'end') {
      const newEnd = snapped > block.start ? snapped : block.start + SNAP_MINUTES
      g = { ...block, end: newEnd }
    } else if (edge === 'start') {
      const newStart = snapped < block.end ? snapped : block.end - SNAP_MINUTES
      g = { ...block, start: newStart }
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
      else if (df.edge === 'start') onMoveBlock(df.block.id, Math.round(g.start))
    }
    setTick(t => t + 1)
  }, [onMoveBlock, onResizeBlock])

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
