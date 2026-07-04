import React from 'react'
import { CATEGORY_COLORS, SLEEP_CATEGORY, MINUTES_IN_DAY } from '../store/constants'
import { Badge } from '../design-system/components'
import { IconClock, IconEdit, IconArchive, IconTrash } from '../design-system/icons'
import { minutesToStr, formatDuration } from '../utils'

export function BlockList({ blocks, selectedId, onSelectBlock, onDeleteBlock, onArchiveBlock, onEditBlock, contextBlockId, onContextMenu, contextRef, onEditRule }) {
  if (blocks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--clr-text-tertiary)' }}>
        <div style={{ marginBottom: 12, opacity: 0.4 }}>
          <IconClock />
        </div>
        <p style={{ fontSize: 14, marginBottom: 4 }}>
          No blocks yet
        </p>
        <p style={{ fontSize: 13 }}>
          Tap <strong>Add</strong> to plan your day
        </p>
      </div>
    )
  }

  const sorted = [...blocks].sort((a, b) => a.start - b.start)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
      {sorted.map(block => {
        const isSelected = block.id === selectedId
        const color = CATEGORY_COLORS[block.category] || CATEGORY_COLORS.other
        return (
            <div
              key={block.id}
              onClick={() => onSelectBlock(block.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectBlock(block.id) } }}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 6,
              backgroundColor: isSelected ? 'var(--clr-bg-secondary)' : 'transparent',
              border: `2px solid ${isSelected ? color : 'transparent'}`,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ width: 4, height: 32, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--clr-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {block.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--clr-text-tertiary)' }}>
                {minutesToStr(block.start)} – {minutesToStr(block.end)} · {formatDuration(block.end <= block.start ? block.end + MINUTES_IN_DAY - block.start : block.end - block.start)}
              </div>
            </div>
            <Badge variant="default">{block.category}</Badge>
            {block.category === SLEEP_CATEGORY ? (
              <div style={{
                fontSize: 11, color: 'var(--clr-text-tertiary)',
                padding: '4px 6px', whiteSpace: 'nowrap',
              }}>
                Locked
              </div>
            ) : (
              <>
                {block.is_recurring && (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={e => { e.stopPropagation(); onContextMenu(block.id) }}
                      aria-label="More options"
                      style={{
                        display: 'flex', padding: 4, border: 'none', background: 'none',
                        color: 'var(--clr-text-tertiary)', cursor: 'pointer', borderRadius: 4,
                        fontSize: 16, lineHeight: 1,
                      }}
                    >
                      ⋮
                    </button>
                    {contextBlockId === block.id && (
                      <div ref={contextRef} style={{
                        position: 'absolute', right: 0, top: '100%', zIndex: 50,
                        minWidth: 140, padding: 4,
                        background: 'var(--clr-surface-elevated)',
                        border: '1px solid var(--clr-border)',
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}>
                        {[
                          { label: 'Edit this day', action: () => { onEditBlock(block); onContextMenu(null) } },
                          { label: 'Edit rule', action: () => { onContextMenu(null); onEditRule && onEditRule() } },
                          { label: 'Skip', action: () => { onDeleteBlock(block.id); onContextMenu(null) } },
                        ].map(item => (
                          <button
                            key={item.label}
                            onClick={e => { e.stopPropagation(); item.action() }}
                            style={{
                              display: 'block', width: '100%', padding: '6px 10px',
                              border: 'none', background: 'none', cursor: 'pointer',
                              fontSize: 13, textAlign: 'left', color: 'var(--clr-text)',
                              borderRadius: 4,
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--clr-bg-secondary)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={e => { e.stopPropagation(); onEditBlock(block) }}
                  aria-label={`Edit ${block.label}`}
                  style={{
                    display: 'flex',
                    padding: 4,
                    border: 'none',
                    background: 'none',
                    color: 'var(--clr-text-tertiary)',
                    cursor: 'pointer',
                    borderRadius: 4,
                  }}
                >
                  <IconEdit />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onArchiveBlock(block.id) }}
                  aria-label={`Archive ${block.label}`}
                  style={{
                    display: 'flex',
                    padding: 4,
                    border: 'none',
                    background: 'none',
                    color: 'var(--clr-text-tertiary)',
                    cursor: 'pointer',
                    borderRadius: 4,
                  }}
                >
                  <IconArchive />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onDeleteBlock(block.id) }}
                  aria-label={`Delete ${block.label}`}
                  style={{
                    display: 'flex',
                    padding: 4,
                    border: 'none',
                    background: 'none',
                    color: 'var(--clr-text-tertiary)',
                    cursor: 'pointer',
                    borderRadius: 4,
                  }}
                >
                  <IconTrash />
                </button>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
