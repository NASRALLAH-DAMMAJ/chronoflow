import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabase } from '../lib/SupabaseContext'
import { fetchRules, addRule, updateRule, deleteRule } from '../lib/recurringRules'
import { fetchBlocksByRule, deleteBlock } from '../lib/blocks'
import { CATEGORY_COLORS } from '../store/constants'
import { Button, Card, Modal } from '../design-system/components'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatMinutes(m) {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function emptyRule() {
  return {
    id: crypto.randomUUID(),
    daysOfWeek: [],
    startMin: 480,
    duration: 60,
    label: '',
    category: 'other',
    activeUntil: null,
  }
}

export default function RecurringRulesPage() {
  const { supabase, user } = useSupabase()
  const navigate = useNavigate()
  const [rules, setRules] = useState([])
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteBlockCount, setDeleteBlockCount] = useState(0)

  useEffect(() => {
    fetchRules(supabase).then(data => {
      setRules(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [supabase])

  const handleSave = useCallback(async () => {
    if (!editing.label.trim()) return
    if (editing.daysOfWeek.length === 0) return

    try {
      if (rules.find(r => r.id === editing.id)) {
        await updateRule(supabase, editing.id, editing)
        setRules(prev => prev.map(r => r.id === editing.id ? editing : r))
      } else {
        await addRule(supabase, editing, user.id)
        setRules(prev => [...prev, editing])
      }
      setEditing(null)
    } catch (e) {
      console.error('Failed to save rule:', e)
    }
  }, [editing, rules, supabase])

  const handleDelete = useCallback(async (id) => {
    try {
      const { count, blocks } = await fetchBlocksByRule(supabase, id)
      if (count > 0) {
        setDeleteTarget(id)
        setDeleteBlockCount(count)
      } else {
        await deleteRule(supabase, id)
        setRules(prev => prev.filter(r => r.id !== id))
      }
    } catch (e) {
      console.error('Failed to delete rule:', e)
    }
  }, [supabase])

  const confirmDeleteBlocks = useCallback(async () => {
    if (!deleteTarget) return
    try {
      const { blocks } = await fetchBlocksByRule(supabase, deleteTarget)
      await Promise.all(blocks.map(b => deleteBlock(supabase, b.id)))
      await deleteRule(supabase, deleteTarget)
      setRules(prev => prev.filter(r => r.id !== deleteTarget))
      setDeleteTarget(null)
    } catch (e) {
      console.error('Failed to delete rule and blocks:', e)
    }
  }, [supabase, deleteTarget])

  const confirmKeepBlocks = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deleteRule(supabase, deleteTarget)
      setRules(prev => prev.filter(r => r.id !== deleteTarget))
      setDeleteTarget(null)
    } catch (e) {
      console.error('Failed to delete rule:', e)
    }
  }, [supabase, deleteTarget])

  if (loading) {
    return (
      <div style={{ padding: 24, color: 'var(--clr-text-secondary)', fontSize: 14 }}>
        Loading rules...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 'var(--sp-6) var(--sp-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/')} style={{
          border: 'none', background: 'none',
          color: 'var(--clr-text-tertiary)', cursor: 'pointer', fontSize: 16, padding: 4,
        }}>←</button>
        <h1 style={{ fontSize: 'var(--fs-subtitle)', fontWeight: 600, color: 'var(--clr-text)', margin: 0 }}>
          Recurring Rules
        </h1>
      </div>

      {!editing && (
        <Button variant="primary" size="sm" onClick={() => setEditing(emptyRule())} style={{ marginBottom: 16 }}>
          + Add rule
        </Button>
      )}

      {editing && (
        <Card padding="var(--sp-4)" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              placeholder="Label"
              value={editing.label}
              onChange={e => setEditing(prev => ({ ...prev, label: e.target.value }))}
              style={{
                padding: '8px 12px',
                fontSize: 14,
                fontFamily: 'var(--ff-body)',
                color: 'var(--clr-text)',
                backgroundColor: 'var(--clr-surface)',
                border: '2px solid var(--clr-border)',
                borderRadius: 6,
              }}
            />
            <div>
              <div style={{ fontSize: 12, color: 'var(--clr-text-tertiary)', marginBottom: 6 }}>Days</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {DAY_NAMES.map((name, i) => (
                  <button
                    key={i}
                    onClick={() => setEditing(prev => ({
                      ...prev,
                      daysOfWeek: prev.daysOfWeek.includes(i)
                        ? prev.daysOfWeek.filter(d => d !== i)
                        : [...prev.daysOfWeek, i],
                    }))}
                    style={{
                      padding: '6px 10px',
                      fontSize: 12,
                      border: `2px solid ${editing.daysOfWeek.includes(i) ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                      borderRadius: 6,
                      backgroundColor: editing.daysOfWeek.includes(i) ? 'var(--clr-primary-light)' : 'transparent',
                      color: editing.daysOfWeek.includes(i) ? 'var(--clr-primary)' : 'var(--clr-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--clr-text-tertiary)', marginBottom: 4 }}>Start</div>
                <input
                  type="time"
                  value={formatMinutes(editing.startMin)}
                  onChange={e => {
                    const [h, m] = e.target.value.split(':').map(Number)
                    setEditing(prev => ({ ...prev, startMin: h * 60 + m }))
                  }}
                  style={{
                    padding: '6px 10px',
                    fontSize: 13,
                    fontFamily: 'var(--ff-mono)',
                    color: 'var(--clr-text)',
                    backgroundColor: 'var(--clr-surface)',
                    border: '2px solid var(--clr-border)',
                    borderRadius: 6,
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--clr-text-tertiary)', marginBottom: 4 }}>Duration (min)</div>
                <input
                  type="number"
                  min={15}
                  step={15}
                  value={editing.duration}
                  onChange={e => setEditing(prev => ({ ...prev, duration: Math.max(15, Number(e.target.value)) }))}
                  style={{
                    padding: '6px 10px',
                    fontSize: 13,
                    fontFamily: 'var(--ff-mono)',
                    color: 'var(--clr-text)',
                    backgroundColor: 'var(--clr-surface)',
                    border: '2px solid var(--clr-border)',
                    borderRadius: 6,
                    width: 80,
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--clr-text-tertiary)', marginBottom: 4 }}>Category</div>
                <select
                  value={editing.category}
                  onChange={e => setEditing(prev => ({ ...prev, category: e.target.value }))}
                  style={{
                    padding: '6px 10px',
                    fontSize: 13,
                    fontFamily: 'var(--ff-body)',
                    color: 'var(--clr-text)',
                    backgroundColor: 'var(--clr-surface)',
                    border: '2px solid var(--clr-border)',
                    borderRadius: 6,
                  }}
                >
                  {Object.keys(CATEGORY_COLORS).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSave}>
                {rules.find(r => r.id === editing.id) ? 'Update' : 'Add'} rule
              </Button>
            </div>
          </div>
        </Card>
      )}

      {rules.length === 0 && !editing && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--clr-text-tertiary)', fontSize: 14 }}>
          No recurring rules set.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rules.map(rule => {
          const color = CATEGORY_COLORS[rule.category] || CATEGORY_COLORS.other
          return (
            <Card key={rule.id} padding="var(--sp-3)" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 4, height: 32, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--clr-text)' }}>
                  {rule.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--clr-text-tertiary)' }}>
                  {rule.daysOfWeek.map(i => DAY_NAMES[i]).join(', ')} · {formatMinutes(rule.startMin)} ({rule.duration}m)
                </div>
              </div>
              <button
                onClick={() => setEditing({ ...rule })}
                style={{
                  padding: 4, border: 'none', background: 'none',
                  color: 'var(--clr-text-tertiary)', cursor: 'pointer', fontSize: 13,
                }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(rule.id)}
                style={{
                  padding: 4, border: 'none', background: 'none',
                  color: 'var(--clr-text-tertiary)', cursor: 'pointer', fontSize: 13,
                }}
              >
                Delete
              </button>
            </Card>
          )
        })}
      </div>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete rule?">
        <p style={{ margin: '0 0 16px', color: 'var(--clr-text)', fontSize: 14, lineHeight: 1.5 }}>
          This rule has {deleteBlockCount} generated block{deleteBlockCount !== 1 ? 's' : ''}. What would you like to do?
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="sm" onClick={confirmKeepBlocks}>
            Keep blocks
          </Button>
          <Button variant="danger" size="sm" onClick={confirmDeleteBlocks}>
            Delete blocks too
          </Button>
        </div>
      </Modal>
    </div>
  )
}
