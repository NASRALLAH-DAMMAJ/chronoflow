import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabase } from '../lib/SupabaseContext'
import { fetchArchivedBlocks, restoreBlock } from '../lib/blocks'
import { CATEGORY_COLORS } from '../store/constants'
import { Button, Card } from '../design-system/components'
import { minutesToStr } from '../utils'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const CATEGORIES = Object.keys(CATEGORY_COLORS)

export default function ArchivePage() {
  const navigate = useNavigate()
  const { supabase, user } = useSupabase()
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const filters = {}
      if (category) filters.category = category
      if (dateFrom) filters.dateFrom = dateFrom
      if (dateTo) filters.dateTo = dateTo
      const data = await fetchArchivedBlocks(supabase, user.id, filters)
      setBlocks(data)
    } catch (e) {
      console.error('Failed to load archived blocks:', e)
    }
    setLoading(false)
  }, [supabase, user, category, dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  const handleRestore = useCallback(async (id) => {
    try {
      await restoreBlock(supabase, id)
      setBlocks(prev => prev.filter(b => b.id !== id))
    } catch (e) {
      console.error('Failed to restore block:', e)
    }
  }, [supabase])

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 'var(--sp-6) var(--sp-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/')} style={{
          border: 'none', background: 'none',
          color: 'var(--clr-text-tertiary)', cursor: 'pointer', fontSize: 16, padding: 4,
        }}>←</button>
        <h1 style={{ fontSize: 'var(--fs-subtitle)', fontWeight: 600, color: 'var(--clr-text)', margin: 0 }}>
          Archive
        </h1>
      </div>

      <Card padding="var(--sp-4)" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--clr-text-tertiary)', marginBottom: 4 }}>Category</div>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{
                padding: '5px 8px', fontSize: 12,
                fontFamily: 'var(--ff-body)',
                color: 'var(--clr-text)',
                backgroundColor: 'var(--clr-surface)',
                border: '2px solid var(--clr-border)',
                borderRadius: 6,
              }}
            >
              <option value="">All</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--clr-text-tertiary)', marginBottom: 4 }}>From</div>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{
                padding: '5px 8px', fontSize: 12,
                fontFamily: 'var(--ff-body)',
                color: 'var(--clr-text)',
                backgroundColor: 'var(--clr-surface)',
                border: '2px solid var(--clr-border)',
                borderRadius: 6,
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--clr-text-tertiary)', marginBottom: 4 }}>To</div>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{
                padding: '5px 8px', fontSize: 12,
                fontFamily: 'var(--ff-body)',
                color: 'var(--clr-text)',
                backgroundColor: 'var(--clr-surface)',
                border: '2px solid var(--clr-border)',
                borderRadius: 6,
              }}
            />
          </div>
          <Button variant="primary" size="sm" onClick={load}>Filter</Button>
        </div>
      </Card>

      {loading ? (
        <div style={{ padding: 24, color: 'var(--clr-text-secondary)', fontSize: 14 }}>
          Loading...
        </div>
      ) : blocks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--clr-text-tertiary)', fontSize: 14 }}>
          No archived blocks.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {blocks.map(block => {
            const color = CATEGORY_COLORS[block.category] || CATEGORY_COLORS.other
            return (
              <Card key={block.id} padding="var(--sp-3)" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 4, height: 32, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--clr-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {block.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--clr-text-tertiary)' }}>
                    {formatDate(block.date)} · {minutesToStr(block.start)} – {minutesToStr(block.end)}
                  </div>
                </div>
                <Badge variant="default">{block.category}</Badge>
                <button
                  onClick={() => handleRestore(block.id)}
                  style={{
                    padding: '4px 10px', fontSize: 12,
                    border: '2px solid var(--clr-border)',
                    borderRadius: 6,
                    background: 'none',
                    color: 'var(--clr-text)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Restore
                </button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Badge({ variant, children }) {
  return (
    <span style={{
      fontSize: 11, padding: '2px 6px', borderRadius: 4,
      backgroundColor: 'var(--clr-bg-secondary)',
      color: 'var(--clr-text-tertiary)',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}
