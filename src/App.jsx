import React, { useState } from 'react'
import { StoreProvider, useStore, getTodayStr, CATEGORY_COLORS } from './store'
import { Dial } from './components/Dial'
import { BlockForm } from './components/BlockForm'
import { Button, Badge, Card } from './design-system/components'
import { useDarkMode } from './design-system/hooks/useDarkMode'
import { IconPlus, IconSun, IconMoon, IconTrash, IconEdit, IconClock, IconChevronLeft, IconChevronRight } from './design-system/icons'

function minutesToStr(m) {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function formatDuration(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const isToday = dateStr === getTodayStr()
  if (isToday) return 'Today'
  const diff = Math.round((today - d) / 86400000)
  if (diff === 1) return 'Yesterday'
  if (diff === -1) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function BlockList({ blocks, selectedId, onSelectBlock, onDeleteBlock, onEditBlock }) {
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
                {minutesToStr(block.start)} – {minutesToStr(block.end)} · {formatDuration(block.end <= block.start ? block.end + 1440 - block.start : block.end - block.start)}
              </div>
            </div>
            <Badge variant="default">{block.category}</Badge>
            <button
              onClick={e => { e.stopPropagation(); onEditBlock(block) }}
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
              onClick={e => { e.stopPropagation(); onDeleteBlock(block.id) }}
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
          </div>
        )
      })}
    </div>
  )
}

function Onboarding({ onDismiss }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    }}>
      <Card padding="var(--sp-6)" style={{ maxWidth: 400, textAlign: 'center' }}>
        <h2 style={{ fontSize: 'var(--fs-subtitle)', fontWeight: 700, marginBottom: 12, color: 'var(--clr-text)' }}>
          Welcome to ChronoFlow
        </h2>
        <p style={{ fontSize: 14, color: 'var(--clr-text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
          See where your time actually goes.
        </p>
        <ul style={{ fontSize: 13, color: 'var(--clr-text-secondary)', lineHeight: 2, listStyle: 'none', padding: 0, margin: '16px 0' }}>
          <li>1. Tap <strong>Add</strong> to plan a block of time</li>
          <li>2. Drag on the dial to set start and end</li>
          <li>3. Drag blocks to move, drag edges to resize</li>
          <li>4. Complete your day at night</li>
        </ul>
        <Button variant="primary" onClick={onDismiss}>Get started</Button>
      </Card>
    </div>
  )
}

let nextBlockId = 100

function AppContent() {
  const { isDark, toggle } = useDarkMode()
  const { blocks, dateStr, selectedId, completedDays, streak, addBlock, updateBlock, deleteBlock, moveBlock, resizeBlock, resizeBlockStart, selectBlock, goToDate, completeDay } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingBlock, setEditingBlock] = useState(null)
  const [placement, setPlacement] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('cf-onboarded'))

  function dismissOnboarding() {
    localStorage.setItem('cf-onboarded', '1')
    setShowOnboarding(false)
  }

  function handleEdit(block) {
    setEditingBlock(block)
    setShowForm(false)
    setPlacement(null)
  }

  function closeForm() {
    setShowForm(false)
    setEditingBlock(null)
  }

  function handlePlaceBlock(label, category) {
    setPlacement({ label, category })
    setShowForm(false)
  }

  function handlePlaceOnDial(startMin, endMin) {
    const snappedStart = Math.round(startMin / 15) * 15
    const snappedEnd = Math.max(snappedStart + 15, Math.round(endMin / 15) * 15)
    addBlock({
      id: Date.now() + nextBlockId++,
      start: snappedStart,
      end: Math.min(snappedEnd, 1440),
      label: placement.label,
      category: placement.category,
      tags: [],
    })
    setPlacement(null)
  }

  function cancelPlacement() {
    setPlacement(null)
  }

  function goToDay(delta) {
    const d = new Date(dateStr + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    goToDate(d)
  }

  const todayStr = getTodayStr()
  const isToday = dateStr === todayStr
  const formOpen = showForm || editingBlock

  return (
    <>
      {showOnboarding && <Onboarding onDismiss={dismissOnboarding} />}
      <div style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: 'var(--sp-6) var(--sp-4)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--sp-6)',
        gap: 'var(--sp-3)',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 'var(--fs-headline)', fontWeight: 700, color: 'var(--clr-text)', margin: 0 }}>
            ChronoFlow
          </h1>
          <span style={{ fontSize: 'var(--fs-small)', color: 'var(--clr-text-secondary)', whiteSpace: 'nowrap' }}>
            · {formatDateLabel(dateStr)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" onClick={() => goToDay(-1)} style={{ display: 'flex', padding: '4px 6px' }}>
            <IconChevronLeft />
          </Button>
          <input
            type="date"
            value={dateStr}
            onChange={e => goToDate(new Date(e.target.value + 'T00:00:00'))}
            style={{
              fontSize: 13,
              padding: '4px 8px',
              fontFamily: 'var(--ff-body)',
              color: 'var(--clr-text)',
              backgroundColor: 'var(--clr-surface)',
              border: '2px solid var(--clr-border)',
              borderRadius: 6,
              outline: 'none',
              maxWidth: 140,
            }}
          />
          <Button variant="ghost" size="sm" onClick={() => goToDay(1)} style={{ display: 'flex', padding: '4px 6px' }}>
            <IconChevronRight />
          </Button>
          {!isToday && (
            <Button variant="ghost" size="sm" onClick={() => goToDate()}>
              Today
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={toggle} style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
            {isDark ? <><IconSun /> Light</> : <><IconMoon /> Dark</>}
          </Button>
        </div>
      </header>

      <div className="app-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: 'var(--sp-6)',
        alignItems: 'start',
        flex: 1,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {placement && (
            <div style={{
              fontSize: 13, color: 'var(--clr-text-secondary)',
              backgroundColor: 'var(--clr-surface)',
              padding: '6px 14px', borderRadius: 6,
              border: '1px solid var(--clr-border)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              Drag on dial to place <strong>{placement.label}</strong>
              <button onClick={cancelPlacement} style={{
                border: 'none', background: 'none',
                color: 'var(--clr-text-tertiary)', cursor: 'pointer', fontSize: 14, padding: 0,
              }}>✕</button>
            </div>
          )}
          <Dial
            blocks={blocks}
            selectedId={selectedId}
            placement={placement}
            onMoveBlock={moveBlock}
            onResizeBlock={resizeBlock}
            onResizeBlockStart={resizeBlockStart}
            onSelectBlock={selectBlock}
            onPlaceBlock={handlePlaceOnDial}
            size={380}
          />
        </div>

        <div>
          <Card padding="var(--sp-4)">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 'var(--fs-subtitle)', fontWeight: 600, color: 'var(--clr-text)', margin: 0 }}>
                Blocks
              </h2>
              <Button variant="primary" size="sm" onClick={() => { setEditingBlock(null); setShowForm(!showForm); setPlacement(null) }}>
                <IconPlus /> Add
              </Button>
            </div>

            {formOpen && (
              <div style={{ marginBottom: 16 }}>
                <BlockForm
                  block={editingBlock}
                  onUpdateBlock={updateBlock}
                  onPlaceBlock={handlePlaceBlock}
                  onClose={closeForm}
                />
              </div>
            )}

            <BlockList
              blocks={blocks}
              selectedId={selectedId}
              onSelectBlock={selectBlock}
              onDeleteBlock={deleteBlock}
              onEditBlock={handleEdit}
            />

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--clr-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, color: 'var(--clr-text-tertiary)' }}>
                Streak: <strong>{streak}</strong> {streak === 1 ? 'day' : 'days'}
              </div>
              {isToday && !completedDays.includes(dateStr) && (
                <Button variant="primary" size="sm" onClick={() => completeDay(dateStr)}>
                  Complete day
                </Button>
              )}
              {completedDays.includes(dateStr) && (
                <Badge variant="default">Reviewed</Badge>
              )}
            </div>
          </Card>
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: 'var(--sp-6) 0', color: 'var(--clr-text-tertiary)', fontSize: 'var(--fs-caption)', marginTop: 'auto' }}>
        ChronoFlow · Time Awareness for Well-being · SDG 3
      </footer>
    </div>
    </>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  )
}
