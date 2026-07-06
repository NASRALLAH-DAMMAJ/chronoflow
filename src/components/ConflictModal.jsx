import React, { useState, useEffect, useRef, useCallback } from 'react'
import { resolveConflict as resolveConflictDetector, pickFields } from '../lib/conflictDetector'

const MODAL_LABEL = 'Sync conflict detected'
const CONFLICT_FIELDS = ['label', 'start', 'end', 'category']

const fieldLabels = {
  label: 'Label',
  start: 'Start time',
  end: 'End time',
  category: 'Category',
}

function formatTime(min) {
  if (min == null) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function BlockPreview({ block, side }) {
  if (!block) {
    return (
      <div data-side={side} style={{ flex: 1, minWidth: 0, padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--clr-surface-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', color: 'var(--clr-text-tertiary)', fontSize: 'var(--fs-small)' }}>
        Deleted
      </div>
    )
  }
  return (
    <div data-side={side} style={{ flex: 1, minWidth: 0, padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--clr-surface-tertiary)' }}>
      <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--clr-text-tertiary)', marginBottom: 4 }}>
        {side === 'local' ? 'Your version' : 'Server version'}
      </div>
      <div style={{ fontWeight: 600, fontSize: 'var(--fs-body)', color: 'var(--clr-text)', marginBottom: 2 }}>{block.label || 'Untitled'}</div>
      <div style={{ fontSize: 'var(--fs-small)', color: 'var(--clr-text-secondary)' }}>
        {formatTime(block.start)} – {formatTime(block.end)}
      </div>
      <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--clr-text-tertiary)', marginTop: 2, textTransform: 'capitalize' }}>
        {block.category || 'other'}
      </div>
    </div>
  )
}

function FieldPicker({ fields, onChange }) {
  return (
    <div role="group" aria-label="Merge fields" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)' }}>
      {CONFLICT_FIELDS.map(field => {
        const selection = fields.find(f => f.name === field) || { name: field, useLocal: true }
        return (
          <label key={field} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: 'var(--fs-small)', color: 'var(--clr-text)', cursor: 'pointer', minHeight: 44, padding: '0 var(--sp-1)' }}>
            <span style={{ minWidth: 80, fontWeight: 500 }}>{fieldLabels[field]}:</span>
            <select
              value={selection.useLocal ? 'local' : 'remote'}
              onChange={e => onChange(field, e.target.value === 'local')}
              style={{ flex: 1, padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', backgroundColor: 'var(--clr-surface)', color: 'var(--clr-text)', fontSize: 'var(--fs-small)', fontFamily: 'inherit', minHeight: 44 }}
            >
              <option value="local">Keep Local</option>
              <option value="remote">Keep Server</option>
            </select>
          </label>
        )
      })}
    </div>
  )
}

export default function ConflictModal({ conflicts, onResolve, onResolveAll, onDismiss }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [applyToAll, setApplyToAll] = useState(false)
  const [mergeState, setMergeState] = useState(() => CONFLICT_FIELDS.map(name => ({ name, useLocal: true })))
  const modalRef = useRef(null)
  const prevConflictsLength = useRef(conflicts.length)

  useEffect(() => {
    if (conflicts.length !== prevConflictsLength.current) {
      setCurrentIndex(0)
      prevConflictsLength.current = conflicts.length
    }
  }, [conflicts.length])

  useEffect(() => {
    if (!modalRef.current) return
    const focusable = modalRef.current.querySelectorAll('button, select, [tabindex]:not([tabindex="-1"])')
    if (focusable.length > 0) focusable[0].focus()
  }, [currentIndex])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onDismiss()
    }
    if (e.key === 'Tab') {
      const focusable = modalRef.current?.querySelectorAll('button, select, [tabindex]:not([tabindex="-1"])')
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [onDismiss])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!conflicts || conflicts.length === 0) return null

  const conflict = conflicts[currentIndex]
  if (!conflict) return null

  const isLast = currentIndex === conflicts.length - 1
  const isDeleteConflict = conflict.type === 'local-update/remote-delete' || conflict.type === 'local-delete/remote-update'

  const handleResolve = (strategy) => {
    if (strategy === 'manual-merge' && conflict.localBlock && conflict.remoteBlock) {
      const merged = pickFields(conflict.localBlock, conflict.remoteBlock, mergeState)
      const mergedConflict = { ...conflict, resolvedBlock: merged }
      onResolve(mergedConflict, 'local-wins')
    } else {
      onResolve(conflict, strategy)
    }
    if (isLast) {
      setCurrentIndex(0)
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  const handleFieldChange = (fieldName, useLocal) => {
    setMergeState(prev => prev.map(f => f.name === fieldName ? { ...f, useLocal } : f))
  }

  const handleResolveAllClick = (strategy) => {
    if (strategy === 'manual-merge' && conflict.localBlock && conflict.remoteBlock) {
      const merged = pickFields(conflict.localBlock, conflict.remoteBlock, mergeState)
      const mergedConflict = { ...conflict, resolvedBlock: merged }
      onResolveAll(mergedConflict, 'local-wins')
    } else {
      onResolveAll(conflict, strategy)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={MODAL_LABEL}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div
        onClick={onDismiss}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
        }}
      />
      <div
        ref={modalRef}
        role="document"
        style={{
          position: 'relative',
          backgroundColor: 'var(--clr-surface-elevated, var(--clr-surface))',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--sp-6)',
          maxWidth: 520,
          width: '90%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          animation: 'scaleIn 0.15s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
          <h2 style={{ fontSize: 'var(--fs-headline)', fontWeight: 600, color: 'var(--clr-text)', margin: 0 }}>
            {MODAL_LABEL}
          </h2>
          <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--clr-text-tertiary)' }}>
            {currentIndex + 1} of {conflicts.length}
          </span>
        </div>

        <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--clr-text-secondary)', marginBottom: 'var(--sp-3)', backgroundColor: 'var(--clr-surface-tertiary)', padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--radius-sm)' }}>
          {conflict.type === 'local-update/remote-update' && 'Both you and another client modified this block.'}
          {conflict.type === 'local-delete/remote-update' && 'You deleted this block, but another client updated it.'}
          {conflict.type === 'local-update/remote-delete' && 'You modified this block, but another client deleted it.'}
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
          <BlockPreview block={conflict.localBlock} side="local" />
          <BlockPreview block={conflict.remoteBlock} side="remote" />
        </div>

        {!isDeleteConflict && (
          <FieldPicker fields={mergeState} onChange={handleFieldChange} />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginTop: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <button
              onClick={() => handleResolve('local-wins')}
              className="transition-all"
              style={{ flex: 1, padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-primary)', backgroundColor: 'var(--clr-primary)', color: 'var(--clr-primary-text, #fff)', fontWeight: 600, fontSize: 'var(--fs-small)', cursor: 'pointer', minHeight: 44 }}
            >
              Keep Local
            </button>
            <button
              onClick={() => handleResolve('remote-wins')}
              className="transition-all"
              style={{ flex: 1, padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)', backgroundColor: 'transparent', color: 'var(--clr-text)', fontWeight: 600, fontSize: 'var(--fs-small)', cursor: 'pointer', minHeight: 44 }}
            >
              Keep Server
            </button>
          </div>
          {!isDeleteConflict && (
            <button
              onClick={() => handleResolve('manual-merge')}
              className="transition-all"
              style={{ width: '100%', padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--clr-border)', backgroundColor: 'transparent', color: 'var(--clr-text-secondary)', fontWeight: 500, fontSize: 'var(--fs-small)', cursor: 'pointer', minHeight: 44 }}
            >
              Merge Manually
            </button>
          )}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)', fontSize: 'var(--fs-small)', color: 'var(--clr-text-secondary)', cursor: 'pointer', minHeight: 44, padding: '0 var(--sp-1)' }}>
          <input
            type="checkbox"
            checked={applyToAll}
            onChange={e => setApplyToAll(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--clr-primary)' }}
          />
          Apply to all remaining conflicts
        </label>

        {applyToAll && (
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
            <button
              onClick={() => handleResolveAllClick('local-wins')}
              style={{ flex: 1, padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-primary)', backgroundColor: 'var(--clr-primary)', color: 'var(--clr-primary-text, #fff)', fontWeight: 600, fontSize: 'var(--fs-small)', cursor: 'pointer', minHeight: 44 }}
            >
              Apply Local
            </button>
            <button
              onClick={() => handleResolveAllClick('remote-wins')}
              style={{ flex: 1, padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)', backgroundColor: 'transparent', color: 'var(--clr-text)', fontWeight: 600, fontSize: 'var(--fs-small)', cursor: 'pointer', minHeight: 44 }}
            >
              Apply Server
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
