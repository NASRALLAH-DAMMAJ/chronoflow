import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSupabase } from '../lib/SupabaseContext'
import { fetchSettings, upsertSettings } from '../lib/settings'
import { useDarkMode } from '../design-system/hooks/useDarkMode'
import { exportToJSON, exportToCSV, importFromJSON, importFromCSV } from '../lib/export'
import { Button } from '../design-system/components'
import { minutesToStr } from '../utils'
import { ROUTES, DEFAULT_BEDTIME, DEFAULT_WAKE, SNAP_MINUTES } from '../store/constants'

function parseTime(str) {
  const [h, m] = str.split(':').map(Number)
  return h * 60 + m
}

const sectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  padding: '16px 12px',
  borderRadius: '50%',
  width: 140,
  height: 140,
  justifyContent: 'center',
  backgroundColor: 'var(--clr-surface-elevated)',
  border: '1px solid var(--clr-border)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'center',
}

const sectionLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--clr-text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { supabase, user } = useSupabase()
  const { setTheme: setAppTheme } = useDarkMode()
  const [sleepStart, setSleepStart] = useState(DEFAULT_BEDTIME)
  const [sleepEnd, setSleepEnd] = useState(DEFAULT_WAKE)
  const [theme, setTheme] = useState('system')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [showHourLabels, setShowHourLabels] = useState(() => {
    try { return localStorage.getItem('chrono_showHourLabels') !== 'false' } catch { return true }
  })
  const [activeSection, setActiveSection] = useState(null)

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

  const sections = [
    {
      id: 'sleep',
      label: 'Sleep',
      content: (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--clr-text-tertiary)', marginBottom: 4 }}>Bedtime</div>
              <input
                type="time"
                value={minutesToStr(sleepStart)}
                onChange={e => setSleepStart(parseTime(e.target.value))}
                style={{
                  padding: '6px 10px', fontSize: 13, fontFamily: 'var(--ff-mono)',
                  color: 'var(--clr-text)', backgroundColor: 'var(--clr-surface)',
                  border: '2px solid var(--clr-border)', borderRadius: 6,
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--clr-text-tertiary)', marginBottom: 4 }}>Wake up</div>
              <input
                type="time"
                value={minutesToStr(sleepEnd)}
                onChange={e => setSleepEnd(parseTime(e.target.value))}
                style={{
                  padding: '6px 10px', fontSize: 13, fontFamily: 'var(--ff-mono)',
                  color: 'var(--clr-text)', backgroundColor: 'var(--clr-surface)',
                  border: '2px solid var(--clr-border)', borderRadius: 6,
                }}
              />
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--clr-text-tertiary)' }}>
            Auto-generated on the dial when you navigate to a day.
          </div>
        </>
      ),
    },
    {
      id: 'theme',
      label: 'Theme',
      content: (
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => { setTheme(opt.value); setAppTheme(opt.value) }}
              style={{
                padding: '6px 14px', fontSize: 13,
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
      ),
    },
    {
      id: 'dial',
      label: 'Dial',
      content: (
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--clr-text-secondary)' }}>
            <input
              type="checkbox"
              checked={showHourLabels}
              onChange={e => {
                setShowHourLabels(e.target.checked)
                try { localStorage.setItem('chrono_showHourLabels', e.target.checked) } catch {}
                window.dispatchEvent(new Event('chrono-setting-changed'))
              }}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            Show hour labels
          </label>
        </>
      ),
    },
    {
      id: 'profile',
      label: 'Profile',
      content: (
        <div style={{ fontSize: 13, color: 'var(--clr-text-secondary)' }}>
          {user?.email || 'Signed in'}
        </div>
      ),
    },
    {
      id: 'rules',
      label: 'Rules',
      content: (
        <Link to={ROUTES.RULES} style={{
          fontSize: 13, color: 'var(--clr-primary)',
          textDecoration: 'none', fontWeight: 500,
        }}>
          Edit recurring rules →
        </Link>
      ),
    },
    {
      id: 'data',
      label: 'Data',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button variant="secondary" size="sm"
              onClick={() => exportToJSON(supabase, user.id).catch(e => alert('Export failed: ' + e.message))}
            >Export JSON</Button>
            <Button variant="secondary" size="sm"
              onClick={() => exportToCSV(supabase, user.id).catch(e => alert('Export failed: ' + e.message))}
            >Export CSV</Button>
          </div>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', fontSize: 13, fontWeight: 500,
            border: '2px solid var(--clr-border)', borderRadius: 6,
            cursor: importing ? 'wait' : 'pointer',
            color: 'var(--clr-text-secondary)', backgroundColor: 'var(--clr-surface)',
            opacity: importing ? 0.6 : 1,
          }}>
            {importing ? 'Importing...' : 'Import'}
            <input type="file" accept=".json,.csv" onChange={handleImport} disabled={importing} style={{ display: 'none' }} />
          </label>
          {importResult && (
            <div style={{
              marginTop: 8, padding: '8px 12px', borderRadius: 8, fontSize: 12,
              backgroundColor: importResult.errors.length > 0 ? '#fef3c7' : '#d1fae5',
              color: importResult.errors.length > 0 ? '#92400e' : '#065f46',
              border: `1px solid ${importResult.errors.length > 0 ? '#fcd34d' : '#6ee7b7'}`,
              maxWidth: 280,
            }}>
              {importResult.blocks > 0 && <div>Imported {importResult.blocks} blocks</div>}
              {importResult.rules > 0 && <div>Imported {importResult.rules} rules</div>}
              {importResult.errors.length > 0 && importResult.errors.slice(0, 3).map((err, i) => <div key={i}>- {err}</div>)}
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <div style={{
      maxWidth: 600,
      margin: '0 auto',
      padding: 'var(--sp-6) var(--sp-4)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, width: '100%' }}>
        <button onClick={() => navigate(ROUTES.HOME)} style={{
          border: 'none', background: 'none',
          color: 'var(--clr-text-tertiary)', cursor: 'pointer', fontSize: 16, padding: 4,
        }}>←</button>
        <h1 style={{ fontSize: 'var(--fs-subtitle)', fontWeight: 600, color: 'var(--clr-text)', margin: 0 }}>
          Settings
        </h1>
      </div>

      {!activeSection && (
        <>
          {/* Profile hub at center */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            backgroundColor: 'var(--clr-primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: 'var(--clr-primary)',
            marginBottom: 32,
          }}>
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>

          {/* Circular segment grid */}
          <div style={{
            display: 'flex', flexWrap: 'wrap',
            justifyContent: 'center', gap: 16,
            maxWidth: 480,
          }}>
            {sections.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = 'var(--clr-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'var(--clr-border)' }}
                style={{
                  ...sectionStyle,
                  animation: `fadeIn 0.3s ease ${i * 0.06}s both`,
                }}
              >
                <div style={sectionLabel}>{s.label}</div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 24 }}>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : saved ? 'Saved' : 'Save settings'}
            </Button>
          </div>
        </>
      )}

      {activeSection && (
        <div style={{
          width: '100%',
          animation: 'fadeIn 0.2s ease',
        }}>
          <button
            onClick={() => setActiveSection(null)}
            style={{
              border: 'none', background: 'none',
              color: 'var(--clr-primary)', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, padding: '4px 0',
              marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            ← All settings
          </button>
          <div style={{
            padding: 'var(--sp-5)',
            borderRadius: 16,
            backgroundColor: 'var(--clr-surface-elevated)',
            border: '1px solid var(--clr-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}>
            {sections.find(s => s.id === activeSection)?.content}
          </div>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : saved ? 'Saved' : 'Save settings'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
