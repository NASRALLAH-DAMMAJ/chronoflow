import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { drawDial } from './DialCanvas'
import { useDialInteraction } from './useDialInteraction'
import { CATEGORY_COLORS } from '../../store/constants'

function getCurrentMinutes() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

function minutesToStr(m) {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export function Dial({ blocks, selectedId, onMoveBlock, onResizeBlock, onSelectBlock, size = 380 }) {
  const canvasRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(getCurrentMinutes())
  const [zoomRange, setZoomRange] = useState(null)
  const pinchRef = useRef(null)

  const blocksWithColor = useMemo(() =>
    blocks.map(b => ({ ...b, color: CATEGORY_COLORS[b.category] || CATEGORY_COLORS.other })),
    [blocks]
  )

  const { ghost, handlers } = useDialInteraction({
    blocks: blocksWithColor,
    onMoveBlock,
    onResizeBlock,
    onSelectBlock,
    zoomRange,
  })

  const displayBlocks = ghost
    ? blocksWithColor.map(b => b.id === ghost.id ? ghost : b)
    : blocksWithColor

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(getCurrentMinutes()), 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 20

    const root = document.documentElement
    const style = getComputedStyle(root)
    const colors = {
      bg: style.getPropertyValue('--clr-bg').trim() || '#FAFAFA',
      border: style.getPropertyValue('--clr-border').trim() || '#E4E4E7',
      text: style.getPropertyValue('--clr-text').trim() || '#18181B',
      textSecondary: style.getPropertyValue('--clr-text-secondary').trim() || '#71717A',
      primary: style.getPropertyValue('--clr-primary').trim() || '#3B82F6',
      surface: style.getPropertyValue('--clr-surface').trim() || '#FFFFFF',
      accent: style.getPropertyValue('--clr-primary-light').trim() || '#DBEAFE',
    }

    drawDial(ctx, cx, cy, radius, displayBlocks, selectedId, currentTime, colors, zoomRange)
  }, [displayBlocks, selectedId, currentTime, size, zoomRange])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const dx = x - cx
    const dy = y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    const pointerAngle = Math.atan2(dy, dx)
    const pointerRenderMinute = (((pointerAngle + Math.PI / 2) / (2 * Math.PI)) * 1440 + 1440) % 1440

    const zoomFactor = e.deltaY > 0 ? 1.3 : 1 / 1.3

    if (!zoomRange) {
      const fullRange = 1440
      const newRange = Math.max(30, fullRange / zoomFactor)
      const center = pointerRenderMinute
      let start = Math.max(0, center - newRange / 2)
      let end = Math.min(1440, start + newRange)
      if (end - start < 30) { end = Math.min(1440, start + 30) }
      if (end >= 1440) { end = 1440; start = 1440 - Math.max(30, end - start) }
      setZoomRange({ start, end })
    } else {
      const { start, end } = zoomRange
      const range = end - start
      const newRange = Math.max(30, Math.min(1440, range * zoomFactor))

      const pointerWorldMinute = start + (pointerRenderMinute / 1440) * range
      let newStart = pointerWorldMinute - (pointerRenderMinute / 1440) * newRange
      let newEnd = newStart + newRange

      if (newStart < 0) { newStart = 0; newEnd = newRange }
      if (newEnd > 1440) { newEnd = 1440; newStart = 1440 - newRange }

      if (newRange >= 1440) {
        setZoomRange(null)
      } else {
        setZoomRange({ start: newStart, end: newEnd })
      }
    }
  }, [zoomRange])

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const t = e.touches
      pinchRef.current = {
        dist: Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY),
      }
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault()
      const t = e.touches
      const dist = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
      const scale = pinchRef.current.dist / dist
      pinchRef.current.dist = dist

      const rect = e.currentTarget.getBoundingClientRect()
      const cx = rect.width / 2
      const cy = rect.height / 2
      const mx = (t[0].clientX + t[1].clientX) / 2 - rect.left
      const my = (t[0].clientY + t[1].clientY) / 2 - rect.top
      const pointerAngle = Math.atan2(my - cy, mx - cx)
      const pointerRenderMinute = (((pointerAngle + Math.PI / 2) / (2 * Math.PI)) * 1440 + 1440) % 1440

      if (!zoomRange) {
        const fullRange = 1440
        const newRange = Math.max(30, fullRange * scale)
        const center = pointerRenderMinute
        let start = Math.max(0, center - newRange / 2)
        let end = Math.min(1440, start + newRange)
        if (end - start < 30) end = Math.min(1440, start + 30)
        if (end >= 1440) { end = 1440; start = 1440 - Math.max(30, newRange) }
        setZoomRange({ start, end })
      } else {
        const { start, end } = zoomRange
        const range = end - start
        const newRange = Math.max(30, Math.min(1440, range * scale))
        const pointerWorldMinute = start + (pointerRenderMinute / 1440) * range
        let newStart = pointerWorldMinute - (pointerRenderMinute / 1440) * newRange
        let newEnd = newStart + newRange
        if (newStart < 0) { newStart = 0; newEnd = newRange }
        if (newEnd > 1440) { newEnd = 1440; newStart = 1440 - newRange }
        if (newRange >= 1440) setZoomRange(null)
        else setZoomRange({ start: newStart, end: newEnd })
      }
    }
  }, [zoomRange])

  const handleTouchEnd = useCallback(() => {
    pinchRef.current = null
  }, [])

  const resetZoom = useCallback(() => setZoomRange(null), [])

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: size,
          height: size,
          maxWidth: '100%',
          borderRadius: '50%',
          cursor: ghost ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        {...handlers}
      />
      {zoomRange && (
        <div style={{
          position: 'absolute',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 6,
          backgroundColor: 'var(--clr-surface-elevated)',
          border: '1px solid var(--clr-border)',
          fontSize: 11,
          color: 'var(--clr-text-secondary)',
          fontFamily: 'var(--ff-mono)',
          whiteSpace: 'nowrap',
          zIndex: 10,
        }}>
          {minutesToStr(zoomRange.start)} – {minutesToStr(zoomRange.end)}
          <button
            onClick={resetZoom}
            style={{
              border: 'none',
              background: 'none',
              color: 'var(--clr-text-tertiary)',
              cursor: 'pointer',
              fontSize: 13,
              padding: '0 2px',
              lineHeight: 1,
            }}
            title="Reset zoom"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
