import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { drawDial } from './DialCanvas'
import { useDialInteraction } from './useDialInteraction'
import { CATEGORY_COLORS, MINUTES_IN_DAY, DIAL } from '../../store/constants'
import { minutesToStr } from '../../utils'

function getCurrentMinutes() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

export const Dial = React.memo(function Dial({ blocks, selectedId, onMoveBlock, onResizeBlock, onResizeBlockStart, onSelectBlock, onPlaceBlock, placement, size = 380 }) {
  const canvasRef = useRef(null)
  const wrapperRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(getCurrentMinutes())
  const [zoomRange, setZoomRange] = useState(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [placementStart, setPlacementStart] = useState(null)
  const [placementPos, setPlacementPos] = useState(null)
  const colorsRef = useRef(null)
  const pinchRef = useRef(null)
  const [themeVersion, setThemeVersion] = useState(0)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setContainerWidth(e.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const dialSize = containerWidth > 0 ? Math.min(size, containerWidth) : size

  useEffect(() => {
    if (!placement) {
      setPlacementStart(null)
      setPlacementPos(null)
    }
  }, [placement])

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => {
      colorsRef.current = null
      setThemeVersion(v => v + 1)
    })
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const blocksWithColor = useMemo(() =>
    blocks.map(b => ({ ...b, color: CATEGORY_COLORS[b.category] || CATEGORY_COLORS.other })),
    [blocks]
  )

  const { ghost, handlers } = useDialInteraction({
    blocks: blocksWithColor,
    onMoveBlock,
    onResizeBlock,
    onResizeBlockStart,
    onSelectBlock,
    zoomRange,
    disabled: !!placement,
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
    canvas.width = dialSize * dpr
    canvas.height = dialSize * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)

    const cx = dialSize / 2
    const cy = dialSize / 2
    const radius = dialSize / 2 - DIAL.CANVAS_PADDING

    if (!colorsRef.current) {
      const root = document.documentElement
      const style = getComputedStyle(root)
      colorsRef.current = {
        bg: style.getPropertyValue('--clr-bg').trim() || '#FAFAFA',
        border: style.getPropertyValue('--clr-border').trim() || '#E4E4E7',
        text: style.getPropertyValue('--clr-text').trim() || '#18181B',
        textSecondary: style.getPropertyValue('--clr-text-secondary').trim() || '#71717A',
        primary: style.getPropertyValue('--clr-primary').trim() || '#3B82F6',
        surface: style.getPropertyValue('--clr-surface').trim() || '#FFFFFF',
        accent: style.getPropertyValue('--clr-primary-light').trim() || '#DBEAFE',
      }
    }

    drawDial(ctx, cx, cy, radius, displayBlocks, selectedId, currentTime, colorsRef.current, zoomRange, placement, placementPos, placementStart)
  }, [displayBlocks, selectedId, currentTime, dialSize, zoomRange, placement, placementPos, placementStart, themeVersion])

  const handleWheel = useCallback((e) => {
    if (placement) return
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const dx = x - cx
    const dy = y - cy

    const pointerAngle = Math.atan2(dy, dx)
    const pointerRenderMinute = (((pointerAngle + Math.PI / 2) / (2 * Math.PI)) * MINUTES_IN_DAY + MINUTES_IN_DAY) % MINUTES_IN_DAY

    const zoomFactor = e.deltaY > 0 ? 1.2 : 1 / 1.2

    if (!zoomRange) {
      const newRange = Math.max(60, MINUTES_IN_DAY / zoomFactor)
      const center = pointerRenderMinute
      let start = Math.max(0, center - newRange / 2)
      let end = Math.min(MINUTES_IN_DAY, start + newRange)
      if (end - start < 60) { end = Math.min(MINUTES_IN_DAY, start + 60) }
      if (end >= MINUTES_IN_DAY) { end = MINUTES_IN_DAY; start = MINUTES_IN_DAY - Math.max(60, end - start) }
      setZoomRange({ start, end })
    } else {
      const { start, end } = zoomRange
      const range = end - start
      const newRange = Math.max(60, Math.min(MINUTES_IN_DAY, range / zoomFactor))

      const pointerWorldMinute = start + (pointerRenderMinute / MINUTES_IN_DAY) * range
      let newStart = pointerWorldMinute - (pointerRenderMinute / MINUTES_IN_DAY) * newRange
      let newEnd = newStart + newRange

      if (newStart < 0) { newStart = 0; newEnd = newRange }
      if (newEnd > MINUTES_IN_DAY) { newEnd = MINUTES_IN_DAY; newStart = MINUTES_IN_DAY - newRange }
      if (newRange >= MINUTES_IN_DAY) setZoomRange(null)
      else setZoomRange({ start: newStart, end: newEnd })
    }
  }, [zoomRange, placement])

  const handleKeyDown = useCallback((e) => {
    if (placement) return
    const STEP = e.shiftKey ? 60 : 15
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      setCurrentTime(t => (t + STEP) % MINUTES_IN_DAY)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      setCurrentTime(t => (t - STEP + MINUTES_IN_DAY) % MINUTES_IN_DAY)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setCurrentTime(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setCurrentTime(MINUTES_IN_DAY - 1)
    }
  }, [placement])

  const handleTouchStart = useCallback((e) => {
    if (placement) return
    if (e.touches.length === 2) {
      const t = e.touches
      pinchRef.current = {
        dist: Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY),
      }
    }
  }, [placement])

  const handleTouchMove = useCallback((e) => {
    if (placement) return
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault()
      const t = e.touches
      const dist = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
      const scale = dist / pinchRef.current.dist
      pinchRef.current.dist = dist

      const rect = e.currentTarget.getBoundingClientRect()
      const cx = rect.width / 2
      const cy = rect.height / 2
      const mx = (t[0].clientX + t[1].clientX) / 2 - rect.left
      const my = (t[0].clientY + t[1].clientY) / 2 - rect.top
      const pointerAngle = Math.atan2(my - cy, mx - cx)
    const pointerRenderMinute = (((pointerAngle + Math.PI / 2) / (2 * Math.PI)) * MINUTES_IN_DAY + MINUTES_IN_DAY) % MINUTES_IN_DAY

      if (!zoomRange) {
        const newRange = Math.max(60, MINUTES_IN_DAY / scale)
        const center = pointerRenderMinute
        let start = Math.max(0, center - newRange / 2)
        let end = Math.min(MINUTES_IN_DAY, start + newRange)
        if (end - start < 60) { end = Math.min(MINUTES_IN_DAY, start + 60) }
        if (end >= MINUTES_IN_DAY) { end = MINUTES_IN_DAY; start = MINUTES_IN_DAY - Math.max(60, end - start) }
        setZoomRange({ start, end })
      } else {
        const { start, end } = zoomRange
        const range = end - start
        const newRange = Math.max(60, Math.min(MINUTES_IN_DAY, range / scale))
        const pointerWorldMinute = start + (pointerRenderMinute / MINUTES_IN_DAY) * range
        let newStart = pointerWorldMinute - (pointerRenderMinute / MINUTES_IN_DAY) * newRange
        let newEnd = newStart + newRange
        if (newStart < 0) { newStart = 0; newEnd = newRange }
        if (newEnd > MINUTES_IN_DAY) { newEnd = MINUTES_IN_DAY; newStart = MINUTES_IN_DAY - newRange }
        if (newRange >= MINUTES_IN_DAY) setZoomRange(null)
        else setZoomRange({ start: newStart, end: newEnd })
      }
    }
  }, [zoomRange, placement])

  const handleTouchEnd = useCallback(() => {
    pinchRef.current = null
  }, [])

  const resetZoom = useCallback(() => setZoomRange(null), [])

  const handlePlacePointerDown = useCallback((e) => {
    if (!placement || placementStart !== null) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const dx = x - cx
    const dy = y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const radius = Math.min(cx, cy) - 20
    const innerR = radius * DIAL.INNER_RADIUS_RATIO
    if (dist < innerR || dist > radius) return
    const angle = Math.atan2(dy, dx)
    const minute = (((angle + Math.PI / 2) / (2 * Math.PI)) * MINUTES_IN_DAY + MINUTES_IN_DAY) % MINUTES_IN_DAY
    setPlacementStart(minute)
    setPlacementPos(minute)
  }, [placement, placementStart])

  const handlePlacePointerMove = useCallback((e) => {
    if (!placement) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const dx = x - cx
    const dy = y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const radius = Math.min(cx, cy) - 20
    const innerR = radius * DIAL.INNER_RADIUS_RATIO
    if (dist < innerR || dist > radius) {
      setPlacementPos(null)
      return
    }
    const angle = Math.atan2(dy, dx)
    const minute = (((angle + Math.PI / 2) / (2 * Math.PI)) * MINUTES_IN_DAY + MINUTES_IN_DAY) % MINUTES_IN_DAY
    setPlacementPos(minute)
  }, [placement])

  const handlePlacePointerUp = useCallback((e) => {
    if (!placement || placementStart === null) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const dx = x - cx
    const dy = y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const radius = Math.min(cx, cy) - 20
    const innerR = radius * DIAL.INNER_RADIUS_RATIO
    if (dist < innerR || dist > radius) {
      setPlacementStart(null)
      setPlacementPos(null)
      return
    }
    const angle = Math.atan2(dy, dx)
    const minute = (((angle + Math.PI / 2) / (2 * Math.PI)) * MINUTES_IN_DAY + MINUTES_IN_DAY) % MINUTES_IN_DAY
    onPlaceBlock(placementStart, minute)
    setPlacementStart(null)
    setPlacementPos(null)
  }, [placement, placementStart, onPlaceBlock])

  const handlePlacePointerLeave = useCallback(() => {
    if (!placement || placementStart === null) return
    setPlacementStart(null)
    setPlacementPos(null)
  }, [placement, placementStart])

  const getCursorStyle = () => {
    if (placement) return placementStart != null ? 'grabbing' : 'crosshair'
    if (ghost) return 'grabbing'
    return 'grab'
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', maxWidth: size, margin: '0 auto' }}>
      <div className="sr-only" aria-live="polite">
        {displayBlocks.length > 0
          ? `Current time: ${minutesToStr(currentTime)}. ${displayBlocks.length} block${displayBlocks.length !== 1 ? 's' : ''} scheduled.`
          : `Current time: ${minutesToStr(currentTime)}. No blocks scheduled.`
        }
      </div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`24-hour time dial showing ${minutesToStr(currentTime)}. ${displayBlocks.length} time block${displayBlocks.length !== 1 ? 's' : ''}.`}
        aria-roledescription="Interactive circular time dial"
        tabIndex={0}
        style={{
          width: '100%',
          maxWidth: '100%',
          aspectRatio: 1,
          height: 'auto',
          borderRadius: '50%',
          cursor: getCursorStyle(),
          touchAction: 'none',
          userSelect: 'none',
        }}
        onWheel={placement ? undefined : handleWheel}
        onTouchStart={placement ? undefined : handleTouchStart}
        onTouchMove={placement ? undefined : handleTouchMove}
        onTouchEnd={placement ? undefined : handleTouchEnd}
        onPointerDown={placement ? handlePlacePointerDown : handlers.onPointerDown}
        onPointerMove={placement ? handlePlacePointerMove : handlers.onPointerMove}
        onPointerUp={placement ? handlePlacePointerUp : handlers.onPointerUp}
        onPointerLeave={placement ? handlePlacePointerLeave : handlers.onPointerLeave}
        onKeyDown={handleKeyDown}
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
            aria-label="Reset zoom"
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
})
