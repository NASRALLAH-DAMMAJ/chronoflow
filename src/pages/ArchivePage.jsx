import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabase } from '../lib/SupabaseContext'
import { fetchArchivedBlocks, restoreBlock } from '../lib/blocks'
import { CATEGORY_COLORS, ROUTES, LOCALE } from '../store/constants'
import { Button, Card, Badge } from '../design-system/components'
import { minutesToStr } from '../utils'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(LOCALE, { weekday: 'short', month: 'short', day: 'numeric' })
}

const CATEGORIES = Object.keys(CATEGORY_COLORS)

export default function ArchivePage() {
  const navigate = useNavigate()
  const { supabase, user } = useSupabase()
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [category, setCategory] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const filters = {}
      if (category) filters.category = category
      if (dateFrom) filters.dateFrom = dateFrom
      if (dateTo) filters.dateTo = dateTo
      const data = await fetchArchivedBlocks(supabase, user.id, filters)
      setBlocks(data)
    } catch (e) {
      console.error('Failed to load archived blocks:', e)
      setError(e.message || 'Failed to load archived blocks')
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
        <button onClick={() => navigate(ROUTES.HOME)} style={{
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

      {error && (
        <div style={{
          backgroundColor: '#fee2e2', border: '1px solid #fca5a5',
          color: '#991b1b', padding: '12px 16px', borderRadius: 8,
          fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <strong>Error:</strong> {error}
          <button onClick={load} style={{
            marginLeft: 'auto', padding: '4px 10px', fontSize: 12,
            backgroundColor: '#fff', border: '1px solid #fca5a5',
            borderRadius: 4, cursor: 'pointer', color: '#991b1b',
          }}>Retry</button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 24, color: 'var(--clr-text-secondary)', fontSize: 14 }}>
          Loading...
        </div>
      ) : blocks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--clr-text-tertiary)' }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📦</div>
          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, color: 'var(--clr-text-secondary)' }}>
            No archived blocks
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.5 }}>
            Blocks you archive will appear here.<br />
            Archive a block from the block list to keep your dial clean.
          </p>
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
