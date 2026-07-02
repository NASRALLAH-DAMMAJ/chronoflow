import React, { useState } from 'react'
import { StoreProvider, useStore, getTodayStr, CATEGORY_COLORS } from './store'
import { Dial } from './components/Dial'
import { BlockForm } from './components/BlockForm'
import { Button, Badge, Card } from './design-system/components'
import { useDarkMode } from './design-system/hooks/useDarkMode'
import { IconPlus, IconSun, IconMoon, IconTrash, IconEdit } from './design-system/icons'

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

function BlockList({ blocks, selectedId, onSelectBlock, onDeleteBlock, onEditBlock }) {
  if (blocks.length === 0) {
    return (
      <p style={{ color: 'var(--clr-text-tertiary)', fontSize: 14, textAlign: 'center', padding: 24 }}>
        No blocks yet. Add one above.
      </p>
    )
  }

  const sorted = [...blocks].sort((a, b) => a.start - b.start)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                {minutesToStr(block.start)} – {minutesToStr(block.end)} · {formatDuration(block.end - block.start)}
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

function AppContent() {
  const { isDark, toggle } = useDarkMode()
  const { blocks, dateStr, selectedId, addBlock, updateBlock, deleteBlock, moveBlock, resizeBlock, selectBlock } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingBlock, setEditingBlock] = useState(null)

  function handleEdit(block) {
    setEditingBlock(block)
  }

  function closeForm() {
    setShowForm(false)
    setEditingBlock(null)
  }

  const formOpen = showForm || editingBlock

  return (
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
      }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-headline)', fontWeight: 700, color: 'var(--clr-text)', margin: 0 }}>
            ChronoFlow
          </h1>
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--clr-text-secondary)', marginTop: 2 }}>
            {dateStr}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button variant="ghost" size="sm" onClick={toggle} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isDark ? <><IconSun /> Light</> : <><IconMoon /> Dark</>}
          </Button>
        </div>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: 'var(--sp-6)',
        alignItems: 'start',
        flex: 1,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Dial
            blocks={blocks}
            selectedId={selectedId}
            onMoveBlock={moveBlock}
            onResizeBlock={resizeBlock}
            onSelectBlock={selectBlock}
            size={380}
          />
        </div>

        <div>
          <Card padding="var(--sp-4)">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 'var(--fs-subtitle)', fontWeight: 600, color: 'var(--clr-text)', margin: 0 }}>
                Blocks
              </h2>
              <Button variant="primary" size="sm" onClick={() => { setEditingBlock(null); setShowForm(!showForm) }}>
                <IconPlus /> Add
              </Button>
            </div>

            {formOpen && (
              <div style={{ marginBottom: 16 }}>
                <BlockForm
                  block={editingBlock}
                  onAddBlock={addBlock}
                  onUpdateBlock={updateBlock}
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
          </Card>
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: 'var(--sp-6) 0', color: 'var(--clr-text-tertiary)', fontSize: 'var(--fs-caption)', marginTop: 'auto' }}>
        ChronoFlow · Time Awareness for Well-being · SDG 3
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  )
}
