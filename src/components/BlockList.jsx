import React from 'react'
import { CATEGORY_COLORS, MINUTES_IN_DAY } from '../store/constants'
import { IconClock } from '../design-system/icons'
import { Lock, Unlock, Pencil, Archive, Trash2, MoreVertical } from 'lucide-react'
import { minutesToStr, formatDuration } from '../utils'

const iconBtnStyle = {
  display: 'flex',
  padding: 3,
  border: 'none',
  background: 'none',
  color: 'var(--clr-text-tertiary)',
  cursor: 'pointer',
  borderRadius: 4,
  flexShrink: 0,
}

export const BlockList = React.memo(function BlockList({ blocks, selectedId, onSelectBlock, onDeleteBlock, onArchiveBlock, onEditBlock, onToggleLock, contextBlockId, onContextMenu, contextRef, onEditRule }) {
  if (blocks.length === 0) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--clr-text-tertiary)' }}>
        <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>
          <IconClock />
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, color: 'var(--clr-text-secondary)' }}>
          No blocks yet
        </p>
        <p style={{ fontSize: 13, lineHeight: 1.5 }}>
          Tap <strong>Add</strong> or click the dial<br />
          to plan your day
        </p>
      </div>
    )
  }

  const sorted = [...blocks].sort((a, b) => a.start - b.start)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 400, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      {sorted.map((block, index) => {
        const isSelected = block.id === selectedId
        const color = CATEGORY_COLORS[block.category] || CATEGORY_COLORS.other
        const isSleep = block.category === 'sleep'
        return (
          <div
            key={block.id}
            className="hover-lift transition-all"
            onClick={() => onSelectBlock(block.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectBlock(block.id) } }}
            tabIndex={0}
            role="button"
            aria-pressed={isSelected}
            aria-label={`${block.label}, ${minutesToStr(block.start)} to ${minutesToStr(block.end)}, ${block.category}`}
            style={{
              animation: `fadeInUp 0.2s ease-out ${index * 0.03}s both`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              borderRadius: 6,
              backgroundColor: isSelected ? 'var(--clr-bg-secondary)' : 'transparent',
              border: `2px solid ${isSelected ? color : 'transparent'}`,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s ease',
              flexWrap: 'nowrap',
            }}
          >
            <div style={{ width: 3, height: 28, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--clr-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {block.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--clr-text-tertiary)' }}>
                {minutesToStr(block.start)} – {minutesToStr(block.end)} · {formatDuration(block.end <= block.start ? block.end + MINUTES_IN_DAY - block.start : block.end - block.start)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--clr-bg-secondary)', color: 'var(--clr-text-secondary)', whiteSpace: 'nowrap' }}>
                {block.category}
              </span>
              {block.is_recurring && (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={e => { e.stopPropagation(); onContextMenu(block.id) }}
                    aria-label="More options"
                    style={iconBtnStyle}
                  >
                    <MoreVertical size={14} />
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
                style={iconBtnStyle}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onToggleLock && onToggleLock(block.id) }}
                aria-label={block.locked ? `Unlock ${block.label}` : `Lock ${block.label}`}
                style={{ ...iconBtnStyle, color: block.locked ? '#D97706' : 'var(--clr-text-tertiary)' }}
              >
                {block.locked ? <Unlock size={14} /> : <Lock size={14} />}
              </button>
              <button
                onClick={e => { e.stopPropagation(); onArchiveBlock(block.id) }}
                aria-label={`Archive ${block.label}`}
                style={iconBtnStyle}
              >
                <Archive size={14} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDeleteBlock(block.id) }}
                aria-label={`Delete ${block.label}`}
                style={iconBtnStyle}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
})
