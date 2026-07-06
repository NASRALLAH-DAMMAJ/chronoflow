import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { CATEGORY_COLORS, MINUTES_IN_DAY } from '../store/constants'
import { IconClock } from '../design-system/icons'
import { Lock, Unlock, Pencil, Archive, Trash2, MoreVertical, ArrowUp } from 'lucide-react'
import { minutesToStr, formatDuration } from '../utils'

const iconBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 44,
  height: 44,
  padding: 0,
  border: 'none',
  background: 'none',
  color: 'var(--clr-text-tertiary)',
  cursor: 'pointer',
  borderRadius: 8,
  flexShrink: 0,
  touchAction: 'manipulation',
  transition: 'transform 0.1s ease, background-color 0.1s ease',
  WebkitTapHighlightColor: 'transparent',
}

const iconBtnPressed = {
  transform: 'scale(0.92)',
  backgroundColor: 'var(--clr-bg-secondary)',
}

function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        padding: '10px 10px',
        borderRadius: 8,
      }}
    >
      <div style={{ width: 4, borderRadius: 2, backgroundColor: 'var(--clr-border)', flexShrink: 0, marginRight: 10, opacity: 0.5 }} />
      <div style={{ flex: '1 1 0', minWidth: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
        <div style={{ height: 14, width: '60%', borderRadius: 4, backgroundColor: 'var(--clr-border)', opacity: 0.4, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 10, width: '40%', borderRadius: 4, backgroundColor: 'var(--clr-border)', opacity: 0.3, animation: 'skeleton-pulse 1.5s ease-in-out infinite 0.2s' }} />
      </div>
    </div>
  )
}

function BlockCard({ block, isSelected, index, onSelectBlock, onEditBlock, onDeleteBlock, onArchiveBlock, onToggleLock, onContextMenu, contextBlockId, contextRef, onEditRule, style }) {
  const color = CATEGORY_COLORS[block.category] || CATEGORY_COLORS.other
  const dur = block.end <= block.start
    ? block.end + MINUTES_IN_DAY - block.start
    : block.end - block.start
  const [pressedBtn, setPressedBtn] = useState(null)

  const iconBtnStyle = useCallback((btnId) => ({
    ...iconBtn,
    ...(pressedBtn === btnId ? iconBtnPressed : {}),
  }), [pressedBtn])

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
        contain: 'content',
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 52px',
        ...style,
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        padding: '10px 10px',
        borderRadius: 8,
        backgroundColor: isSelected ? 'var(--clr-bg-secondary)' : 'transparent',
        border: `2px solid ${isSelected ? color : 'transparent'}`,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ width: 4, borderRadius: 2, backgroundColor: color, flexShrink: 0, marginRight: 10 }} />
      <div style={{ flex: '1 1 0', minWidth: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, overflow: 'hidden' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {block.label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--clr-text-secondary)', whiteSpace: 'nowrap' }}>
            {minutesToStr(block.start)} – {minutesToStr(block.end)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--clr-text-tertiary)', flexShrink: 0 }}>
            {formatDuration(dur)}
          </span>
          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, backgroundColor: 'var(--clr-bg-secondary)', color: 'var(--clr-text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {block.category}
          </span>
          {block.is_recurring && (
            <span style={{ fontSize: 10, color: 'var(--clr-text-tertiary)', flexShrink: 0 }}>↻</span>
          )}
        </div>
      </div>
      <div className="block-actions-desktop" style={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, marginLeft: 4 }}>
        {block.is_recurring && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={e => { e.stopPropagation(); onContextMenu(block.id) }}
              aria-label="More options"
              style={iconBtnStyle('more')}
              onMouseDown={() => setPressedBtn('more')}
              onMouseUp={() => setPressedBtn(null)}
              onMouseLeave={() => setPressedBtn(null)}
              onTouchStart={() => setPressedBtn('more')}
              onTouchEnd={() => setPressedBtn(null)}
            >
              <MoreVertical size={13} />
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
          style={iconBtnStyle('edit')}
          onMouseDown={() => setPressedBtn('edit')}
          onMouseUp={() => setPressedBtn(null)}
          onMouseLeave={() => setPressedBtn(null)}
          onTouchStart={() => setPressedBtn('edit')}
          onTouchEnd={() => setPressedBtn(null)}
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onToggleLock && onToggleLock(block.id) }}
          aria-label={block.locked ? `Unlock ${block.label}` : `Lock ${block.label}`}
          style={{ ...iconBtnStyle('lock'), color: block.locked ? '#92400E' : 'var(--clr-text-secondary)' }}
          onMouseDown={() => setPressedBtn('lock')}
          onMouseUp={() => setPressedBtn(null)}
          onMouseLeave={() => setPressedBtn(null)}
          onTouchStart={() => setPressedBtn('lock')}
          onTouchEnd={() => setPressedBtn(null)}
        >
          {block.locked ? <Unlock size={13} /> : <Lock size={13} />}
        </button>
        <button
          onClick={e => { e.stopPropagation(); onArchiveBlock(block.id) }}
          aria-label={`Archive ${block.label}`}
          style={iconBtnStyle('archive')}
          onMouseDown={() => setPressedBtn('archive')}
          onMouseUp={() => setPressedBtn(null)}
          onMouseLeave={() => setPressedBtn(null)}
          onTouchStart={() => setPressedBtn('archive')}
          onTouchEnd={() => setPressedBtn(null)}
        >
          <Archive size={13} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDeleteBlock(block.id) }}
          aria-label={`Delete ${block.label}`}
          style={iconBtnStyle('delete')}
          onMouseDown={() => setPressedBtn('delete')}
          onMouseUp={() => setPressedBtn(null)}
          onMouseLeave={() => setPressedBtn(null)}
          onTouchStart={() => setPressedBtn('delete')}
          onTouchEnd={() => setPressedBtn(null)}
        >
          <Trash2 size={13} />
        </button>
      </div>
      <div className="block-actions-mobile" style={{ display: 'none', alignItems: 'center', gap: 1, flexShrink: 0, marginLeft: 4 }}>
        <button
          onClick={e => { e.stopPropagation(); onEditBlock(block) }}
          aria-label={`Edit ${block.label}`}
          style={iconBtnStyle('edit-m')}
          onMouseDown={() => setPressedBtn('edit-m')}
          onMouseUp={() => setPressedBtn(null)}
          onMouseLeave={() => setPressedBtn(null)}
          onTouchStart={() => setPressedBtn('edit-m')}
          onTouchEnd={() => setPressedBtn(null)}
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDeleteBlock(block.id) }}
          aria-label={`Delete ${block.label}`}
          style={iconBtnStyle('delete-m')}
          onMouseDown={() => setPressedBtn('delete-m')}
          onMouseUp={() => setPressedBtn(null)}
          onMouseLeave={() => setPressedBtn(null)}
          onTouchStart={() => setPressedBtn('delete-m')}
          onTouchEnd={() => setPressedBtn(null)}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export const BlockList = React.memo(function BlockList({ blocks, selectedId, onSelectBlock, onDeleteBlock, onArchiveBlock, onEditBlock, onToggleLock, contextBlockId, onContextMenu, contextRef, onEditRule }) {
  const scrollRef = useRef(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const sorted = useMemo(() => [...blocks].sort((a, b) => a.start - b.start), [blocks])

  const handleScroll = useCallback(() => {
    setIsScrolling(true)
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 150)
  }, [])

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [])

  const scrollToTop = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (sorted.length === 0) return

    const currentIndex = focusedIndex >= 0 ? focusedIndex : sorted.findIndex(b => b.id === selectedId)

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        const next = currentIndex < sorted.length - 1 ? currentIndex + 1 : 0
        setFocusedIndex(next)
        onSelectBlock(sorted[next].id)
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        const prev = currentIndex > 0 ? currentIndex - 1 : sorted.length - 1
        setFocusedIndex(prev)
        onSelectBlock(sorted[prev].id)
        break
      }
      case 'Enter': {
        if (currentIndex >= 0) {
          e.preventDefault()
          onEditBlock(sorted[currentIndex])
        }
        break
      }
      case 'Delete': {
        if (currentIndex >= 0) {
          e.preventDefault()
          onDeleteBlock(sorted[currentIndex].id)
        }
        break
      }
      case 'Escape': {
        e.preventDefault()
        setFocusedIndex(-1)
        onSelectBlock(null)
        break
      }
    }
  }, [sorted, focusedIndex, selectedId, onSelectBlock, onEditBlock, onDeleteBlock])

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

  return (
    <div style={{ position: 'relative' }}>
      {sorted.length > 5 && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to first block"
          style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            zIndex: 10,
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '1px solid var(--clr-border)',
            backgroundColor: 'var(--clr-surface)',
            color: 'var(--clr-text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.15s ease',
          }}
          title="Scroll to first block"
        >
          <ArrowUp size={14} />
        </button>
      )}
      <div
        ref={scrollRef}
        role="listbox"
        aria-label="Time blocks"
        aria-orientation="vertical"
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          maxHeight: 440,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {sorted.map((block, index) => {
          const isSelected = block.id === selectedId
          const isFocused = index === focusedIndex
          return (
            <div
              key={block.id}
              role="option"
              aria-selected={isSelected}
              aria-label={`${block.label}, ${minutesToStr(block.start)} to ${minutesToStr(block.end)}, ${block.category}`}
              style={{
                contain: 'content',
                contentVisibility: 'auto',
                containIntrinsicSize: 'auto 52px',
              }}
            >
              <BlockCard
                block={block}
                isSelected={isSelected}
                index={index}
                onSelectBlock={onSelectBlock}
                onEditBlock={onEditBlock}
                onDeleteBlock={onDeleteBlock}
                onArchiveBlock={onArchiveBlock}
                onToggleLock={onToggleLock}
                onContextMenu={onContextMenu}
                contextBlockId={contextBlockId}
                contextRef={contextRef}
                onEditRule={onEditRule}
                style={{
                  animation: isFocused ? 'none' : undefined,
                  outline: isFocused ? '2px solid var(--clr-focus)' : undefined,
                  outlineOffset: isFocused ? '2px' : undefined,
                }}
              />
            </div>
          )
        })}
        {isScrolling && sorted.length > 10 && Array.from({ length: Math.min(3, sorted.length) }).map((_, i) => (
          <SkeletonCard key={`skeleton-${i}`} />
        ))}
      </div>
    </div>
  )
})
