import React, { useState, useEffect } from 'react'
import { Button } from '../../design-system/components'
import { BLOCK_CATEGORIES } from '../../store/constants'

function minutesToStr(m) {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function strToMinutes(s) {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + m
}

let nextId = 100

function findOverlaps(blocks, startMin, endMin, excludeId) {
  return blocks.filter(b => {
    if (b.id === excludeId) return false
    return b.start < endMin && b.end > startMin
  })
}

export function BlockForm({ block, blocks = [], onAddBlock, onUpdateBlock, onClose }) {
  const isEditing = !!block
  const [label, setLabel] = useState(block ? block.label : '')
  const [start, setStart] = useState(block ? minutesToStr(block.start) : '09:00')
  const [end, setEnd] = useState(block ? minutesToStr(block.end) : '10:00')
  const [category, setCategory] = useState(block ? block.category : 'work')

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && onClose) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e) {
    e.preventDefault()
    if (!label.trim()) return
    const startMin = strToMinutes(start)
    const endMin = strToMinutes(end) || 1440
    if (endMin <= startMin) return

    if (isEditing) {
      onUpdateBlock(block.id, { start: startMin, end: endMin, label: label.trim(), category })
    } else {
      onAddBlock({
        id: Date.now() + nextId++,
        start: startMin,
        end: endMin,
        label: label.trim(),
        category,
        tags: [],
      })
    }

    if (onClose) onClose()
  }

  const startMin = strToMinutes(start)
  const endMin = strToMinutes(end) || 1440
  const overlaps = endMin > startMin ? findOverlaps(blocks, startMin, endMin, block?.id) : []

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--clr-text-secondary)', marginBottom: 4, display: 'block' }}>
          Label
        </label>
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="e.g. Deep work"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 14,
            fontFamily: 'var(--ff-body)',
            color: 'var(--clr-text)',
            backgroundColor: 'var(--clr-surface)',
            border: '2px solid var(--clr-border)',
            borderRadius: 6,
            outline: 'none',
            boxSizing: 'border-box',
          }}
          autoFocus
        />
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--clr-text-secondary)', marginBottom: 4, display: 'block' }}>
            Start
          </label>
          <input
            type="time"
            value={start}
            onChange={e => setStart(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 14,
              fontFamily: 'var(--ff-body)',
              color: 'var(--clr-text)',
              backgroundColor: 'var(--clr-surface)',
              border: '2px solid var(--clr-border)',
              borderRadius: 6,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--clr-text-secondary)', marginBottom: 4, display: 'block' }}>
            End
          </label>
          <input
            type="time"
            value={end}
            onChange={e => setEnd(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 14,
              fontFamily: 'var(--ff-body)',
              color: 'var(--clr-text)',
              backgroundColor: 'var(--clr-surface)',
              border: '2px solid var(--clr-border)',
              borderRadius: 6,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--clr-text-secondary)', marginBottom: 4, display: 'block' }}>
          Category
        </label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 14,
            fontFamily: 'var(--ff-body)',
            color: 'var(--clr-text)',
            backgroundColor: 'var(--clr-surface)',
            border: '2px solid var(--clr-border)',
            borderRadius: 6,
            outline: 'none',
          }}
        >
          {BLOCK_CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      {overlaps.length > 0 && (
        <div style={{
          fontSize: 12, color: 'var(--clr-warning, #F59E0B)',
          backgroundColor: 'color-mix(in srgb, var(--clr-warning, #F59E0B) 10%, transparent)',
          padding: '6px 10px', borderRadius: 6,
        }}>
          Overlaps with: {overlaps.map(b => b.label).join(', ')}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        {onClose && <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>}
        <Button variant="primary" type="submit" disabled={!label.trim() || endMin <= startMin}>{isEditing ? 'Update' : 'Add Block'}</Button>
      </div>
    </form>
  )
}
