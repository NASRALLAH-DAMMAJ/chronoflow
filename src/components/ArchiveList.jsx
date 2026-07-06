import React, { useState, useEffect, useCallback } from 'react'
import { useSupabase } from '../lib/SupabaseContext'
import { fetchArchivedBlocks } from '../lib/blocks'
import { CATEGORY_COLORS } from '../store/constants'
import { minutesToStr } from '../utils'
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = (today - d) / 86400000
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return d.toLocaleDateString(undefined, { weekday: 'short' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const iconBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 22,
  height: 22,
  padding: 0,
  border: 'none',
  background: 'none',
  color: 'var(--clr-text-tertiary)',
  cursor: 'pointer',
  borderRadius: 4,
  flexShrink: 0,
}

export default function ArchiveList({ onRestore }) {
  const { supabase, user } = useSupabase()
  const [expanded, setExpanded] = useState(false)
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!user || !expanded) return
    setLoading(true)
    try {
      const data = await fetchArchivedBlocks(supabase, user.id, { limit: 30 })
      setBlocks(data)
    } catch (e) {
      console.error('Failed to load archived blocks:', e)
    }
    setLoading(false)
  }, [supabase, user, expanded])

  useEffect(() => { load() }, [load])

  const handleRestore = useCallback(async (block) => {
    try {
      await onRestore(block.id)
      setBlocks(prev => prev.filter(b => b.id !== block.id))
    } catch (e) {
      console.error('Failed to restore block:', e)
    }
  }, [onRestore])

  const handleDragStart = useCallback((e, block) => {
    e.dataTransfer.setData('application/chrono-block-id', block.id)
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', block.label)
  }, [])

  if (blocks.length === 0 && !expanded) return null

  return (
    <div style={{ marginBottom: expanded ? 12 : 0, borderBottom: expanded ? '1px solid var(--clr-border)' : 'none', paddingBottom: expanded ? 12 : 0 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '6px 0',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontSize: 12,
          color: 'var(--clr-text-secondary)',
          fontWeight: 500,
        }}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Archived ({blocks.length})
      </button>

      {expanded && (
        <div className="animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
          {loading ? (
            <div style={{ padding: '8px 0', fontSize: 12, color: 'var(--clr-text-tertiary)' }}>Loading...</div>
          ) : blocks.length === 0 ? (
            <div style={{ padding: '8px 0', fontSize: 12, color: 'var(--clr-text-tertiary)' }}>No archived blocks</div>
          ) : (
            blocks.map(block => {
              const color = CATEGORY_COLORS[block.category] || CATEGORY_COLORS.other
              return (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 6px',
                    borderRadius: 6,
                    fontSize: 12,
                    opacity: 0.85,
                    cursor: 'grab',
                  }}
                >
                  <div style={{ width: 3, height: 24, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: 'var(--clr-text)', fontWeight: 500 }}>{block.label}</span>
                    <span style={{ color: 'var(--clr-text-tertiary)', marginLeft: 6 }}>
                      {formatDate(block.date)} · {minutesToStr(block.start)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRestore(block) }}
                    aria-label={`Restore ${block.label}`}
                    style={iconBtn}
                    title="Restore to today"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
