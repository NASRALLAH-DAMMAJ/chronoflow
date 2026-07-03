import React, { useState, useEffect } from 'react'
import { Button } from '../../design-system/components'
import { BLOCK_CATEGORIES } from '../../store/constants'
import { TimeBar } from './TimeBar'

export function BlockForm({ block, onUpdateBlock, onPlaceBlock, onClose }) {
  const isEditing = !!block
  const [label, setLabel] = useState(block ? block.label : '')
  const [startMin, setStartMin] = useState(block ? block.start : 540)
  const [endMin, setEndMin] = useState(block ? block.end : 600)
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

    if (isEditing) {
      const finalEnd = endMin <= startMin ? startMin + 15 : endMin
      onUpdateBlock(block.id, {
        start: startMin,
        end: Math.min(finalEnd, 1440),
        label: label.trim(),
        category,
      })
      if (onClose) onClose()
    } else {
      onPlaceBlock(label.trim(), category)
    }
  }

  const duration = endMin > startMin ? endMin - startMin : 1440 - startMin + endMin

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            boxSizing: 'border-box',
          }}
          autoFocus
        />
      </div>

      {isEditing && (
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--clr-text-secondary)', marginBottom: 6, display: 'block' }}>
            Duration
          </label>
          <TimeBar duration={duration} onChange={(newDur) => {
            const newEnd = (startMin + newDur) % 1440
            setEndMin(newEnd)
          }} />
        </div>
      )}

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
          }}
        >
          {BLOCK_CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        {onClose && <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>}
        <Button variant="primary" type="submit" disabled={!label.trim()}>{isEditing ? 'Update' : 'Next: Place on dial'}</Button>
      </div>
    </form>
  )
}
