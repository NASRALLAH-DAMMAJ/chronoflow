import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { drawDial } from './DialCanvas'
import { useDialInteraction } from './useDialInteraction'
import { useDialGesture } from '../../hooks/useDialGesture'
import { toWorldMinute } from './zoom-utils'
import { CATEGORY_COLORS, MINUTES_IN_DAY, DIAL, SNAP_MINUTES } from '../../store/constants'
import { minutesToStr, snapToGrid } from '../../utils'
import RangeSelector from '../RangeSelector'

function getCurrentMinutes() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

export const Dial = React.memo(function Dial({ blocks, selectedId, onMoveBlock, onResizeBlock, onResizeBlockStart, onSelectBlock, onPlaceBlock, onDropArchive, placement, size = 380 }) {
  const canvasRef = useRef(null)
  const wrapperRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(getCurrentMinutes())
  const [zoomRange, setZoomRange] = useState(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [placementStart, setPlacementStart] = useState(null)
  const [placementPos, setPlacementPos] = useState(null)
  const colorsRef = useRef(null)
  const [themeVersion, setThemeVersion] = useState(0)
  const [showRangeSelector, setShowRangeSelector] = useState(false)
  const [timeFormat, setTimeFormat] = useState(() => {
    try { return localStorage.getItem('chrono_timeFormat') || '24h' } catch { return '24h' }
  })
  const [labelInterval, setLabelInterval] = useState(() => {
    try { return parseInt(localStorage.getItem('chrono_labelInterval')) || 180 } catch { return 180 }
  })
  const [showHourLabels, setShowHourLabels] = useState(() => {
    try { return localStorage.getItem('chrono_showHourLabels') !== 'false' } catch { return true }
  })
  useEffect(() => {
    const handler = () => {
      try { setShowHourLabels(localStorage.getItem('chrono_showHourLabels') !== 'false') } catch {}
    }
    window.addEventListener('chrono-setting-changed', handler)
    return () => window.removeEventListener('chrono-setting-changed', handler)
  }, [])

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

  const gestureHandlers = useDialGesture({
    blocks: blocksWithColor,
    onSelectBlock,
    onAddBlock: onDialTapAdd,
    onLongPressBlock: onBlockLongPress,
    zoomRange,
    containerRef: wrapperRef,
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

    drawDial(ctx, cx, cy, radius, displayBlocks, selectedId, currentTime, colorsRef.current, zoomRange, placement, placementPos, placementStart, labelInterval, timeFormat, showHourLabels)
  }, [displayBlocks, selectedId, currentTime, dialSize, zoomRange, placement, placementPos, placementStart, themeVersion, labelInterval, timeFormat, showHourLabels])

  const handleRangeSelect = useCallback((range) => {
    setZoomRange(range)
    setShowRangeSelector(false)
  }, [])

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
    const renderMin = (((angle + Math.PI / 2) / (2 * Math.PI)) * MINUTES_IN_DAY + MINUTES_IN_DAY) % MINUTES_IN_DAY
    const minute = toWorldMinute(renderMin, zoomRange)
    setPlacementStart(minute)
    setPlacementPos(minute)
  }, [placement, placementStart, zoomRange])

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
    const renderMin = (((angle + Math.PI / 2) / (2 * Math.PI)) * MINUTES_IN_DAY + MINUTES_IN_DAY) % MINUTES_IN_DAY
    const minute = toWorldMinute(renderMin, zoomRange)
    setPlacementPos(minute)
  }, [placement, zoomRange])

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
    const renderMin = (((angle + Math.PI / 2) / (2 * Math.PI)) * MINUTES_IN_DAY + MINUTES_IN_DAY) % MINUTES_IN_DAY
    const minute = toWorldMinute(renderMin, zoomRange)
    onPlaceBlock(placementStart, minute)
    setPlacementStart(null)
    setPlacementPos(null)
  }, [placement, placementStart, zoomRange, onPlaceBlock])

  const handlePlacePointerLeave = useCallback(() => {
    if (!placement || placementStart === null) return
    setPlacementStart(null)
    setPlacementPos(null)
  }, [placement, placementStart])

  const [dragOver, setDragOver] = useState(false)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    if (!dragOver) setDragOver(true)
  }, [dragOver])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    if (!onDropArchive) return
    const blockId = e.dataTransfer.getData('application/chrono-block-id')
    if (!blockId) return
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
    const renderMin = (((angle + Math.PI / 2) / (2 * Math.PI)) * MINUTES_IN_DAY + MINUTES_IN_DAY) % MINUTES_IN_DAY
    const minute = snapToGrid(toWorldMinute(renderMin, zoomRange), SNAP_MINUTES)
    onDropArchive(blockId, minute)
  }, [onDropArchive, zoomRange])

  const getCursorStyle = () => {
    if (placement) return placementStart != null ? 'grabbing' : 'crosshair'
    if (ghost) return 'grabbing'
    return dragOver ? 'copy' : 'grab'
  }

  return (
    <div
      ref={wrapperRef}
      className="dial-wrapper"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: size,
        margin: '0 auto',
        outline: dragOver ? '3px dashed var(--clr-primary)' : 'none',
        outlineOffset: 8,
        borderRadius: '50%',
        transition: 'outline 0.15s ease',
      }}
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {displayBlocks.length > 0
          ? `Current time: ${minutesToStr(currentTime)}. ${displayBlocks.length} block${displayBlocks.length !== 1 ? 's' : ''} scheduled.`
          : `Current time: ${minutesToStr(currentTime)}. No blocks scheduled.`
        }
      </div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`24-hour time dial. Current time: ${minutesToStr(currentTime)}. ${displayBlocks.length} block${displayBlocks.length !== 1 ? 's' : ''} scheduled. Use arrow keys to navigate. Space to select. Escape to deselect.`}
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
        onPointerDown={placement ? handlePlacePointerDown : handlers.onPointerDown}
        onPointerMove={placement ? handlePlacePointerMove : handlers.onPointerMove}
        onPointerUp={placement ? handlePlacePointerUp : handlers.onPointerUp}
        onPointerLeave={placement ? handlePlacePointerLeave : handlers.onPointerLeave}
        onTouchStart={gestureHandlers.onTouchStart}
        onTouchMove={gestureHandlers.onTouchMove}
        onTouchEnd={gestureHandlers.onTouchEnd}
        onKeyDown={handleKeyDown}
      />
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        marginTop: 8,
      }}>
        <button
          onClick={() => setShowRangeSelector(true)}
          aria-label="Select time range"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '8px 12px',
            minHeight: 44,
            borderRadius: 6,
            backgroundColor: 'var(--clr-surface-elevated)',
            border: '1px solid var(--clr-border)',
            fontSize: 11,
            fontFamily: 'var(--ff-mono)',
            color: 'var(--clr-text-secondary)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            touchAction: 'manipulation',
          }}
        >
          {zoomRange
            ? <>{minutesToStr(zoomRange.start)} – {minutesToStr(zoomRange.end)}</>
            : 'Full day'}
          {zoomRange && (
            <span
              onClick={(e) => { e.stopPropagation(); resetZoom() }}
              style={{ marginLeft: 2, color: 'var(--clr-text-tertiary)', fontSize: 13, lineHeight: 1 }}
            >
              ✕
            </span>
          )}
        </button>
        <button
          onClick={() => {
            const next = timeFormat === '24h' ? '12h' : '24h'
            setTimeFormat(next)
            try { localStorage.setItem('chrono_timeFormat', next) } catch {}
          }}
          title="Toggle 12h/24h time format"
          style={{
            padding: '8px 10px', borderRadius: 6, fontSize: 10,
            backgroundColor: 'var(--clr-surface-elevated)',
            border: '1px solid var(--clr-border)',
            color: 'var(--clr-text-secondary)',
            cursor: 'pointer', fontFamily: 'var(--ff-mono)',
            minHeight: 44, minWidth: 44,
            touchAction: 'manipulation',
          }}
        >
          {timeFormat}
        </button>
        <button
          onClick={() => {
            const intervals = [0, 60, 120, 180, 240, 360, 720, 1440]
            const idx = intervals.indexOf(labelInterval)
            const next = intervals[(idx + 1) % intervals.length]
            setLabelInterval(next)
            try { localStorage.setItem('chrono_labelInterval', String(next)) } catch {}
          }}
          title="Change label interval"
          style={{
            padding: '8px 10px', borderRadius: 6, fontSize: 10,
            backgroundColor: 'var(--clr-surface-elevated)',
            border: '1px solid var(--clr-border)',
            color: 'var(--clr-text-secondary)',
            cursor: 'pointer', fontFamily: 'var(--ff-mono)',
            minHeight: 44, minWidth: 44,
            touchAction: 'manipulation',
          }}
        >
          {labelInterval === 0 ? '--' : labelInterval === 1440 ? 'Full' : labelInterval / 60 + 'h'}
        </button>
      </div>

      {showRangeSelector && (
        <RangeSelector
          currentRange={zoomRange}
          onSelect={handleRangeSelect}
          onClose={() => setShowRangeSelector(false)}
        />
      )}
    </div>
  )
})
