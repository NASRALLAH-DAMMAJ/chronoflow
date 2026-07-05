import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSupabase } from '../lib/SupabaseContext'
import { fetchSettings, upsertSettings } from '../lib/settings'
import { exportToJSON, exportToCSV, importFromJSON, importFromCSV } from '../lib/export'
import { Button, Card } from '../design-system/components'
import { minutesToStr } from '../utils'
import { ROUTES, DEFAULT_BEDTIME, DEFAULT_WAKE, SNAP_MINUTES } from '../store/constants'

function parseTime(str) {
  const [h, m] = str.split(':').map(Number)
  return h * 60 + m
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { supabase, user } = useSupabase()
  const [sleepStart, setSleepStart] = useState(DEFAULT_BEDTIME)
  const [sleepEnd, setSleepEnd] = useState(DEFAULT_WAKE)
  const [theme, setTheme] = useState('system')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  useEffect(() => {
    if (!user) return
    fetchSettings(supabase, user.id).then(data => {
      if (data) {
        setSleepStart(data.sleep_start)
        setSleepEnd(data.sleep_end)
        setTheme(data.theme)
      }
      setLoading(false)
    }).catch(e => {
      setError(e.message || 'Failed to load settings')
      setLoading(false)
    })
  }, [supabase, user])

  const handleSave = useCallback(async () => {
    if (!user) return
    setSaving(true)
    try {
      await upsertSettings(supabase, user.id, {
        sleepStart: Math.round(sleepStart / SNAP_MINUTES) * SNAP_MINUTES,
        sleepEnd: Math.round(sleepEnd / SNAP_MINUTES) * SNAP_MINUTES,
        theme,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
    setSaving(false)
  }, [supabase, user, sleepStart, sleepEnd, theme])

  const handleImport = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setImporting(true)
    setImportResult(null)
    try {
      const isJSON = file.name.endsWith('.json')
      const result = isJSON
        ? await importFromJSON(supabase, user.id, file)
        : await importFromCSV(supabase, user.id, file)
      setImportResult(result)
    } catch (err) {
      setImportResult({ errors: [err.message], blocks: 0, rules: 0 })
    }
    setImporting(false)
    e.target.value = ''
  }, [supabase, user])

  if (loading) {
    return (
      <div style={{ padding: 24, color: 'var(--clr-text-secondary)', fontSize: 14 }}>
        Loading settings...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 'var(--sp-6) var(--sp-4)' }}>
        <div style={{
          backgroundColor: '#fee2e2', border: '1px solid #fca5a5',
          color: '#991b1b', padding: '16px 20px', borderRadius: 8,
          fontSize: 14,
        }}>
          <strong>Error:</strong> {error}
          <button
            onClick={() => { setError(null); setLoading(true) }}
            style={{
              marginLeft: 12, padding: '4px 12px', fontSize: 13,
              backgroundColor: '#fff', border: '1px solid #fca5a5',
              borderRadius: 4, cursor: 'pointer', color: '#991b1b',
            }}
          >Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 'var(--sp-6) var(--sp-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate(ROUTES.HOME)} style={{
          border: 'none', background: 'none',
          color: 'var(--clr-text-tertiary)', cursor: 'pointer', fontSize: 16, padding: 4,
        }}>←</button>
        <h1 style={{ fontSize: 'var(--fs-subtitle)', fontWeight: 600, color: 'var(--clr-text)', margin: 0 }}>
          Settings
        </h1>
      </div>

      <Card padding="var(--sp-4)" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', margin: '0 0 16px' }}>
          Sleep Schedule
        </h2>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--clr-text-tertiary)', marginBottom: 4 }}>Bedtime</div>
            <input
              type="time"
              value={minutesToStr(sleepStart)}
              onChange={e => setSleepStart(parseTime(e.target.value))}
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
            <div style={{ fontSize: 12, color: 'var(--clr-text-tertiary)', marginBottom: 4 }}>Wake up</div>
            <input
              type="time"
              value={minutesToStr(sleepEnd)}
              onChange={e => setSleepEnd(parseTime(e.target.value))}
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
        </div>
        <div style={{ fontSize: 12, color: 'var(--clr-text-tertiary)' }}>
          Sleep block auto-generated on the dial when you navigate to a day.
        </div>
      </Card>

      <Card padding="var(--sp-4)" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', margin: '0 0 16px' }}>
          Theme
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                border: `2px solid ${theme === opt.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                borderRadius: 6,
                backgroundColor: theme === opt.value ? 'var(--clr-primary-light)' : 'transparent',
                color: theme === opt.value ? 'var(--clr-primary)' : 'var(--clr-text-secondary)',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      <Card padding="var(--sp-4)" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', margin: '0 0 8px' }}>
          Profile
        </h2>
        <div style={{ fontSize: 13, color: 'var(--clr-text-secondary)' }}>
          {user?.email || 'Signed in'}
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save settings'}
        </Button>
      </div>

      <Card padding="var(--sp-4)">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', margin: '0 0 4px' }}>
              Recurring Rules
            </h2>
            <div style={{ fontSize: 12, color: 'var(--clr-text-tertiary)' }}>
              Manage blocks that repeat on certain days
            </div>
          </div>
          <Link to={ROUTES.RULES} style={{
            fontSize: 13, color: 'var(--clr-primary)',
            textDecoration: 'none', fontWeight: 500,
          }}>
            Edit rules
          </Link>
        </div>
      </Card>

      <Card padding="var(--sp-4)" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', margin: '0 0 12px' }}>
          Data Export
        </h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportToJSON(supabase, user.id).catch(e => alert('Export failed: ' + e.message))}
          >
            Export JSON (all data)
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportToCSV(supabase, user.id).catch(e => alert('Export failed: ' + e.message))}
          >
            Export CSV (all blocks)
          </Button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--clr-text-tertiary)', marginTop: 8 }}>
          Download your data as JSON (full backup) or CSV (blocks only).
        </div>
      </Card>

      <Card padding="var(--sp-4)" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', margin: '0 0 12px' }}>
          Data Import
        </h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', fontSize: 13, fontWeight: 500,
            border: '2px solid var(--clr-border)', borderRadius: 6,
            cursor: importing ? 'wait' : 'pointer',
            color: 'var(--clr-text-secondary)',
            backgroundColor: 'var(--clr-surface)',
            opacity: importing ? 0.6 : 1,
          }}>
            {importing ? 'Importing...' : 'Import JSON or CSV'}
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleImport}
              disabled={importing}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        {importResult && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 8, fontSize: 13,
            backgroundColor: importResult.errors.length > 0 ? '#fef3c7' : '#d1fae5',
            color: importResult.errors.length > 0 ? '#92400e' : '#065f46',
            border: `1px solid ${importResult.errors.length > 0 ? '#fcd34d' : '#6ee7b7'}`,
          }}>
            {importResult.blocks > 0 && <div>Imported {importResult.blocks} block{importResult.blocks !== 1 ? 's' : ''}</div>}
            {importResult.rules > 0 && <div>Imported {importResult.rules} rule{importResult.rules !== 1 ? 's' : ''}</div>}
            {importResult.settings && <div>Imported settings</div>}
            {importResult.errors.length > 0 && (
              <div style={{ marginTop: 4 }}>
                {importResult.errors.slice(0, 5).map((err, i) => <div key={i}>- {err}</div>)}
                {importResult.errors.length > 5 && <div>- ...and {importResult.errors.length - 5} more errors</div>}
              </div>
            )}
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--clr-text-tertiary)', marginTop: 8 }}>
          Import from a ChronoFlow JSON backup or a CSV file with columns: Date, Label, Category, Start, Duration (min).
        </div>
      </Card>
    </div>
  )
}
