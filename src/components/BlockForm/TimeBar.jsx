import React, { useRef, useState, useCallback, useEffect } from 'react'

const SNAP = 15
const MINUTES_IN_DAY = 1440

function snap(minutes) {
  return Math.round(minutes / SNAP) * SNAP
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

export function TimeBar({ duration, onChange }) {
  const trackRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, duration: 0 })

  const dur = clamp(duration, SNAP, MINUTES_IN_DAY)
  const durPct = (dur / MINUTES_IN_DAY) * 100

  const handlePointerDown = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = trackRef.current.getBoundingClientRect()
    dragStartRef.current = { x: e.clientX, duration: dur, rectWidth: rect.width }
    setDragging(true)
  }, [dur])

  const handlePointerMove = useCallback((e) => {
    if (!dragging) return
    e.preventDefault()
    const { x: startX, duration: origDur, rectWidth } = dragStartRef.current
    const dx = e.clientX - startX
    const dMinutes = Math.round((dx / rectWidth) * MINUTES_IN_DAY)
    const snapped = snap(dMinutes)
    const newDur = clamp(origDur + snapped, SNAP, MINUTES_IN_DAY)
    onChange(newDur)
  }, [dragging, onChange])

  const handlePointerUp = useCallback(() => {
    setDragging(false)
  }, [])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('touchmove', handlePointerMove, { passive: false })
      window.addEventListener('touchend', handlePointerUp)
      return () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
        window.removeEventListener('touchmove', handlePointerMove)
        window.removeEventListener('touchend', handlePointerUp)
      }
    }
  }, [dragging, handlePointerMove, handlePointerUp])

  const durH = Math.floor(dur / 60)
  const durM = dur % 60
  const durationStr = durH > 0 ? (durM > 0 ? `${durH}h ${durM}m` : `${durH}h`) : `${durM}m`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--clr-primary)' }}>
          {durationStr}
        </span>
      </div>

      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onTouchStart={(e) => {
          const touch = e.touches[0]
          handlePointerDown({ clientX: touch.clientX, preventDefault: () => e.preventDefault(), stopPropagation: () => e.stopPropagation() })
        }}
        style={{
          position: 'relative',
          height: 36,
          backgroundColor: 'var(--clr-bg-secondary)',
          borderRadius: 8,
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <div style={{
          position: 'absolute',
          left: 0,
          width: `${durPct}%`,
          top: 0,
          bottom: 0,
          backgroundColor: 'var(--clr-primary)',
          borderRadius: 8,
          opacity: dragging ? 0.8 : 1,
          transition: dragging ? 'none' : 'opacity 0.15s ease',
        }} />

        <div style={{
          position: 'absolute',
          left: `calc(${durPct}% - 6px)`,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 12,
          height: 24,
          backgroundColor: '#fff',
          border: '2px solid var(--clr-primary)',
          borderRadius: 6,
          cursor: 'ew-resize',
          zIndex: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />

        {[0, 6, 12, 18].map(h => (
          <div key={h} style={{
            position: 'absolute',
            left: `${(h / 24) * 100}%`,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: 'var(--clr-border)',
            opacity: 0.5,
          }} />
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--clr-text-tertiary)' }}>
        <span>0h</span>
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>24h</span>
      </div>
    </div>
  )
}
