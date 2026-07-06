import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MINUTES_IN_DAY, DIAL, SNAP_MINUTES } from '../store/constants'
import { minutesToStr, snapToGrid } from '../utils'

const PRESETS = [
  { label: 'Full day', range: null },
  { label: 'Night (18–6)', range: { start: 1080, end: 360 } },
  { label: 'Day (6–18)', range: { start: 360, end: 1080 } },
  { label: 'Morning', range: { start: 360, end: 720 } },
  { label: 'Afternoon', range: { start: 720, end: 1080 } },
  { label: 'Evening', range: { start: 1080, end: 1440 } },
  { label: 'Night', range: { start: 0, end: 360 } },
]

export default function RangeSelector({ currentRange, onSelect, onClose }) {
  const canvasRef = useRef(null)
  const cur = currentRange || { start: 0, end: MINUTES_IN_DAY }
  const [start, setStart] = useState(cur.start)
  const [end, setEnd] = useState(cur.end)
  const [editing, setEditing] = useState(null)

  const minuteFromPointer = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    const x = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left
    const y = (e.clientY || e.touches?.[0]?.clientY || 0) - rect.top
    const dx = x - cx
    const dy = y - cy
    const angle = Math.atan2(dy, dx)
    return (((angle + Math.PI / 2) / (2 * Math.PI)) * MINUTES_IN_DAY + MINUTES_IN_DAY) % MINUTES_IN_DAY
  }, [])

  const handlePointerDown = useCallback((e) => {
    const raw = minuteFromPointer(e)
    if (raw === null) return
    const m = snapToGrid(Math.round(raw), SNAP_MINUTES)
    const distToStart = Math.min(Math.abs(m - start), MINUTES_IN_DAY - Math.abs(m - start))
    const distToEnd = Math.min(Math.abs(m - end), MINUTES_IN_DAY - Math.abs(m - end))
    if (distToStart <= distToEnd) {
      setEditing('start')
      setStart(m)
    } else {
      setEditing('end')
      setEnd(m)
    }
  }, [minuteFromPointer, start, end])

  const handlePointerMove = useCallback((e) => {
    if (!editing) return
    e.preventDefault()
    const raw = minuteFromPointer(e)
    if (raw === null) return
    const m = snapToGrid(Math.round(raw), SNAP_MINUTES)
    if (editing === 'start') setStart(m)
    else setEnd(m)
  }, [minuteFromPointer, editing])

  const handlePointerUp = useCallback(() => {
    setEditing(null)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const size = canvas.clientWidth
    canvas.width = size * dpr
    canvas.height = size * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 4

    ctx.clearRect(0, 0, size, size)

    const style = getComputedStyle(document.documentElement)
    const bg = style.getPropertyValue('--clr-bg').trim() || '#FAFAFA'
    const border = style.getPropertyValue('--clr-border').trim() || '#E4E4E7'
    const text = style.getPropertyValue('--clr-text').trim() || '#18181B'
    const textSec = style.getPropertyValue('--clr-text-secondary').trim() || '#71717A'
    const primary = style.getPropertyValue('--clr-primary').trim() || '#3B82F6'

    const toAngle = (m) => (m / MINUTES_IN_DAY) * Math.PI * 2 - Math.PI / 2

    ctx.strokeStyle = border
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.stroke()

    let rangeStart = toAngle(start)
    let rangeEnd = toAngle(end)
    let arcLen = rangeEnd - rangeStart
    if (arcLen <= 0) arcLen += Math.PI * 2

    ctx.beginPath()
    ctx.arc(cx, cy, radius - 1, rangeStart, rangeStart + arcLen)
    ctx.strokeStyle = primary
    ctx.lineWidth = 6
    ctx.stroke()

    const drawMarker = (minute, color, label) => {
      const a = toAngle(minute)
      const mx = cx + (radius - 10) * Math.cos(a)
      const my = cy + (radius - 10) * Math.sin(a)
      ctx.beginPath()
      ctx.arc(mx, my, 6, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = textSec
      ctx.font = '9px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      const lx = cx + (radius + 14) * Math.cos(a)
      const ly = cy + (radius + 14) * Math.sin(a)
      ctx.fillText(label, lx, ly)
    }

    drawMarker(start, primary, editing === 'start' ? minutesToStr(start) : '')
    drawMarker(end, '#7C3AED', editing === 'end' ? minutesToStr(end) : '')

    for (let m = 0; m < MINUTES_IN_DAY; m += 120) {
      const a = toAngle(m)
      const isHour = m % 120 === 0
      const r1 = radius - 1
      const r2 = radius * DIAL.INNER_RADIUS_RATIO + 3
      ctx.beginPath()
      ctx.moveTo(cx + r2 * Math.cos(a), cy + r2 * Math.sin(a))
      ctx.lineTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a))
      ctx.strokeStyle = isHour ? textSec : border
      ctx.lineWidth = isHour ? 1 : 0.5
      ctx.stroke()
    }
  }, [start, end, editing])

  return (
    <div
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="animate-slide-down"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--clr-surface-elevated)',
          borderRadius: 16,
          padding: 20,
          width: 280,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', margin: '0 0 12px', textAlign: 'center' }}>
          Select time range
        </h3>

        <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {PRESETS.map(p => {
            const active = (!p.range && !currentRange) ||
              (p.range && currentRange && p.range.start === currentRange.start && p.range.end === currentRange.end)
            return (
              <button
                key={p.label}
                onClick={() => {
                  if (!p.range) {
                    setStart(0)
                    setEnd(MINUTES_IN_DAY)
                  } else {
                    setStart(p.range.start)
                    setEnd(p.range.end)
                  }
                }}
                style={{
                  padding: '4px 10px', fontSize: 10, fontWeight: active ? 600 : 400,
                  border: `1px solid ${active ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                  borderRadius: 6,
                  backgroundColor: active ? 'var(--clr-primary-light)' : 'transparent',
                  color: active ? 'var(--clr-primary)' : 'var(--clr-text-secondary)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        <canvas
          ref={canvasRef}
          style={{ width: '100%', aspectRatio: 1, cursor: 'crosshair', touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, gap: 8, fontSize: 12, color: 'var(--clr-text-secondary)' }}>
          <span>{minutesToStr(start)}</span>
          <span>–</span>
          <span>{minutesToStr(end)}</span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 500,
              border: '1px solid var(--clr-border)', borderRadius: 8,
              background: 'none', color: 'var(--clr-text-secondary)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (Math.round(start) === 0 && Math.round(end) === MINUTES_IN_DAY) {
                onSelect(null)
              } else {
                onSelect({ start: Math.round(start), end: Math.round(end) })
              }
            }}
            style={{
              flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 600,
              border: 'none', borderRadius: 8,
              backgroundColor: 'var(--clr-primary)', color: '#fff',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
