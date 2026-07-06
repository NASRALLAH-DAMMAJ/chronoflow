import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MINUTES_IN_DAY, DIAL } from '../store/constants'
import { minutesToStr } from '../utils'

export default function SleepScheduleDialog({ bedtime: initialBed, wake: initialWake, onSave, onClose }) {
  const canvasRef = useRef(null)
  const [bedtime, setBedtime] = useState(initialBed)
  const [wake, setWake] = useState(initialWake)
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
    const dist = Math.sqrt(dx * dx + dy * dy)
    const radius = Math.min(cx, cy) - 10
    const innerR = radius * DIAL.INNER_RADIUS_RATIO
    if (dist < innerR || dist > radius) return null
    const angle = Math.atan2(dy, dx)
    return (((angle + Math.PI / 2) / (2 * Math.PI)) * MINUTES_IN_DAY + MINUTES_IN_DAY) % MINUTES_IN_DAY
  }, [])

  const handlePointerDown = useCallback((e) => {
    const m = minuteFromPointer(e)
    if (m === null) return
    const distToBed = Math.abs(m - bedtime) % MINUTES_IN_DAY
    const distToWake = Math.abs(m - wake) % MINUTES_IN_DAY
    const d1 = Math.min(distToBed, MINUTES_IN_DAY - distToBed)
    const d2 = Math.min(distToWake, MINUTES_IN_DAY - distToWake)
    if (d1 < d2 && d1 < 60) setEditing('bedtime')
    else if (d2 < 60) setEditing('wake')
    else setEditing('bedtime')
    if (editing === 'bedtime' || (d2 >= 60 && d1 >= 60)) setBedtime(m)
    else setWake(m)
  }, [minuteFromPointer, bedtime, wake, editing])

  const handlePointerMove = useCallback((e) => {
    if (!editing) return
    e.preventDefault()
    const m = minuteFromPointer(e)
    if (m === null) return
    if (editing === 'bedtime') setBedtime(m)
    else setWake(m)
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
    const radius = size / 2 - 10

    ctx.clearRect(0, 0, size, size)

    const style = getComputedStyle(document.documentElement)
    const bg = style.getPropertyValue('--clr-bg').trim() || '#FAFAFA'
    const border = style.getPropertyValue('--clr-border').trim() || '#E4E4E7'
    const text = style.getPropertyValue('--clr-text').trim() || '#18181B'
    const textSec = style.getPropertyValue('--clr-text-secondary').trim() || '#71717A'
    const primary = '#A78BFA'
    const accent = '#7C3AED'

    ctx.strokeStyle = border
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.stroke()

    ctx.strokeStyle = border
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(cx, cy, radius * DIAL.INNER_RADIUS_RATIO, 0, Math.PI * 2)
    ctx.stroke()

    const toAngle = (m) => (m / MINUTES_IN_DAY) * Math.PI * 2 - Math.PI / 2

    const sleepStart = toAngle(bedtime)
    let sleepEnd = toAngle(wake)
    let sleepArc = sleepEnd - sleepStart
    if (sleepArc < 0) sleepArc += Math.PI * 2

    ctx.beginPath()
    ctx.arc(cx, cy, radius - 2, sleepStart, sleepStart + sleepArc)
    ctx.strokeStyle = primary
    ctx.lineWidth = 8
    ctx.lineCap = 'butt'
    ctx.stroke()

    const drawMarker = (minute, label, color) => {
      const a = toAngle(minute)
      const mx = cx + (radius - 16) * Math.cos(a)
      const my = cy + (radius - 16) * Math.sin(a)
      ctx.beginPath()
      ctx.arc(mx, my, 8, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = text
      ctx.font = '11px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      const lx = cx + (radius + 20) * Math.cos(a)
      const ly = cy + (radius + 20) * Math.sin(a)
      ctx.fillText(label, lx, ly)
    }

    drawMarker(bedtime, minutesToStr(bedtime), primary)
    drawMarker(wake, minutesToStr(wake), accent)

    for (let m = 0; m < MINUTES_IN_DAY; m += 60) {
      const a = toAngle(m)
      const isHour = m % 120 === 0
      const r1 = isHour ? radius - 2 : radius - 2
      const r2 = isHour ? radius * DIAL.INNER_RADIUS_RATIO + 4 : radius * DIAL.INNER_RADIUS_RATIO + 2
      ctx.beginPath()
      ctx.moveTo(cx + r2 * Math.cos(a), cy + r2 * Math.sin(a))
      ctx.lineTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a))
      ctx.strokeStyle = isHour ? textSec : border
      ctx.lineWidth = isHour ? 1 : 0.5
      ctx.stroke()
    }
  }, [bedtime, wake])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
      }}
      onClick={onClose}
    >
      <div
        className="animate-slide-down"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--clr-surface-elevated)',
          borderRadius: 16,
          padding: 24,
          width: '90%',
          maxWidth: 360,
          boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--clr-text)', margin: '0 0 16px', textAlign: 'center' }}>
          Sleep Schedule
        </h2>

        <canvas
          ref={canvasRef}
          style={{ width: '100%', aspectRatio: 1, cursor: 'crosshair', touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, gap: 12 }}>
          <div style={{ flex: 1, padding: '8px 12px', backgroundColor: 'var(--clr-bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--clr-text-tertiary)', marginBottom: 2 }}>Bedtime</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#A78BFA' }}>{minutesToStr(bedtime)}</div>
          </div>
          <div style={{ flex: 1, padding: '8px 12px', backgroundColor: 'var(--clr-bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--clr-text-tertiary)', marginBottom: 2 }}>Wake up</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#7C3AED' }}>{minutesToStr(wake)}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 500,
              border: '2px solid var(--clr-border)', borderRadius: 8,
              background: 'none', color: 'var(--clr-text-secondary)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(bedtime, wake)}
            style={{
              flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 600,
              border: 'none', borderRadius: 8,
              backgroundColor: '#A78BFA', color: '#fff',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
