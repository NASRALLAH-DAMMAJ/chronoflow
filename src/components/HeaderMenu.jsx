import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabase } from '../lib/SupabaseContext'
import { fetchSettings, upsertSettings } from '../lib/settings'
import { exportToJSON, exportToCSV } from '../lib/export'
import { fetchBlocksForRange } from '../lib/analytics'
import { Button } from '../design-system/components'
import { minutesToStr } from '../utils'
import { useDarkMode } from '../design-system/hooks/useDarkMode'
import { IconSun, IconMoon } from '../design-system/icons'
import { ROUTES, DEFAULT_BEDTIME, DEFAULT_WAKE, SNAP_MINUTES, CATEGORY_COLORS, NO_CATEGORY } from '../store/constants'
import { BarChart3, Download, LogOut, User, Moon, Sun } from 'lucide-react'

function parseTime(str) {
  const [h, m] = str.split(':').map(Number)
  return h * 60 + m
}

export default function HeaderMenu() {
  const navigate = useNavigate()
  const { supabase, user } = useSupabase()
  const { isDark, toggle } = useDarkMode()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const [sleepStart, setSleepStart] = useState(DEFAULT_BEDTIME)
  const [sleepEnd, setSleepEnd] = useState(DEFAULT_WAKE)
  const [theme, setTheme] = useState('system')
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  useEffect(() => {
    if (!open || !user) return
    setSettingsLoaded(false)
    fetchSettings(supabase, user.id).then(data => {
      if (data) {
        setSleepStart(data.sleep_start)
        setSleepEnd(data.sleep_end)
        setTheme(data.theme)
      }
      setSettingsLoaded(true)
    }).catch(() => setSettingsLoaded(true))
    setAnalyticsLoading(true)
    const to = new Date().toISOString().slice(0, 10)
    const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
    fetchBlocksForRange(supabase, user.id, from, to).then(data => {
      const totalHours = data.reduce((s, b) => s + b.duration / 60, 0)
      const uniqueDates = new Set(data.map(b => b.date)).size
      const catHours = {}
      for (const block of data) {
        catHours[block.category] = (catHours[block.category] || 0) + block.duration / 60
      }
      let topCategory = NO_CATEGORY
      let topHours = 0
      for (const [cat, hrs] of Object.entries(catHours)) {
        if (hrs > topHours) { topHours = hrs; topCategory = cat }
      }
      setAnalytics({
        totalHours: Math.round(totalHours * 10) / 10,
        avgHours: uniqueDates > 0 ? Math.round(totalHours / uniqueDates * 10) / 10 : 0,
        topCategory,
        daysCount: uniqueDates,
      })
      setAnalyticsLoading(false)
    }).catch(() => setAnalyticsLoading(false))
  }, [open, supabase, user])

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleSaveSettings = useCallback(async () => {
    if (!user) return
    setSavingSettings(true)
    try {
      await upsertSettings(supabase, user.id, {
        sleepStart: Math.round(sleepStart / SNAP_MINUTES) * SNAP_MINUTES,
        sleepEnd: Math.round(sleepEnd / SNAP_MINUTES) * SNAP_MINUTES,
        theme,
      })
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
    setSavingSettings(false)
  }, [supabase, user, sleepStart, sleepEnd, theme])

  useEffect(() => {
    if (settingsLoaded) handleSaveSettings()
  }, [sleepStart, sleepEnd, theme, settingsLoaded, handleSaveSettings])

  const handleExportJSON = useCallback(() => {
    exportToJSON(supabase, user.id).catch(e => alert('Export failed: ' + e.message))
  }, [supabase, user])

  const handleExportCSV = useCallback(() => {
    exportToCSV(supabase, user.id).catch(e => alert('Export failed: ' + e.message))
  }, [supabase, user])

  const handleSignOut = useCallback(() => {
    supabase.auth.signOut()
    setOpen(false)
  }, [supabase])

  const menuItem = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '7px 12px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 13,
    color: 'var(--clr-text)',
    borderRadius: 6,
    textAlign: 'left',
    fontFamily: 'inherit',
  }

  const sectionLabel = {
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--clr-text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '8px 12px 4px',
  }

  const inputStyle = {
    padding: '5px 8px',
    fontSize: 12,
    fontFamily: 'var(--ff-mono)',
    color: 'var(--clr-text)',
    backgroundColor: 'var(--clr-surface)',
    border: '1px solid var(--clr-border)',
    borderRadius: 6,
    width: '100%',
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Menu"
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          border: '2px solid var(--clr-border)',
          borderRadius: 8,
          background: 'none',
          cursor: 'pointer',
          color: 'var(--clr-text)',
          fontSize: 13,
          fontWeight: 500,
          fontFamily: 'inherit',
        }}
      >
        <User size={14} />
        Menu
      </button>

      {open && (
        <div className="animate-slide-down" style={{
          position: 'absolute',
          right: 0,
          top: '100%',
          marginTop: 6,
          width: 300,
          maxHeight: '80vh',
          overflowY: 'auto',
          backgroundColor: 'var(--clr-surface-elevated)',
          border: '1px solid var(--clr-border)',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 100,
          padding: '4px 0',
        }}>
          {/* Account */}
          <div style={sectionLabel}>Account</div>
          <div style={{ padding: '4px 12px 8px', fontSize: 12, color: 'var(--clr-text-secondary)' }}>
            {user?.email || 'Signed in'}
          </div>
          <button onClick={handleSignOut} style={menuItem}>
            <LogOut size={14} />
            Sign out
          </button>

          <div style={{ height: 1, backgroundColor: 'var(--clr-border)', margin: '4px 12px' }} />

          {/* Theme */}
          <div style={sectionLabel}>Theme</div>
          <div style={{ display: 'flex', gap: 4, padding: '4px 12px 8px' }}>
            {[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                style={{
                  flex: 1,
                  padding: '5px 0',
                  fontSize: 11,
                  fontWeight: theme === opt.value ? 600 : 400,
                  border: `1px solid ${theme === opt.value ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                  borderRadius: 6,
                  backgroundColor: theme === opt.value ? 'var(--clr-primary-light)' : 'transparent',
                  color: theme === opt.value ? 'var(--clr-primary)' : 'var(--clr-text-secondary)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {opt.value === 'light' ? <><Sun size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} /> Light</>
                  : opt.value === 'dark' ? <><Moon size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} /> Dark</>
                  : opt.label}
              </button>
            ))}
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--clr-border)', margin: '4px 12px' }} />

          {/* Sleep Schedule */}
          <div style={sectionLabel}>Sleep Schedule</div>
          <div style={{ display: 'flex', gap: 12, padding: '4px 12px 8px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'var(--clr-text-tertiary)', marginBottom: 3 }}>Bedtime</div>
              <input
                type="time"
                value={minutesToStr(sleepStart)}
                onChange={e => setSleepStart(parseTime(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'var(--clr-text-tertiary)', marginBottom: 3 }}>Wake up</div>
              <input
                type="time"
                value={minutesToStr(sleepEnd)}
                onChange={e => setSleepEnd(parseTime(e.target.value))}
                style={inputStyle}
              />
            </div>
          </div>
          {savingSettings && <div style={{ padding: '2px 12px 6px', fontSize: 10, color: 'var(--clr-text-tertiary)' }}>Saving...</div>}

          <div style={{ height: 1, backgroundColor: 'var(--clr-border)', margin: '4px 12px' }} />

          {/* Analytics Summary */}
          <div style={sectionLabel}>Analytics (30d)</div>
          <div style={{ padding: '4px 12px 8px' }}>
            {analyticsLoading ? (
              <div style={{ fontSize: 12, color: 'var(--clr-text-tertiary)' }}>Loading...</div>
            ) : analytics ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div style={{ padding: '6px 8px', backgroundColor: 'var(--clr-bg-secondary)', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--clr-text)' }}>{analytics.totalHours}</div>
                  <div style={{ fontSize: 10, color: 'var(--clr-text-tertiary)' }}>Total hours</div>
                </div>
                <div style={{ padding: '6px 8px', backgroundColor: 'var(--clr-bg-secondary)', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--clr-text)' }}>{analytics.avgHours}</div>
                  <div style={{ fontSize: 10, color: 'var(--clr-text-tertiary)' }}>Avg/day</div>
                </div>
                <div style={{ padding: '6px 8px', backgroundColor: 'var(--clr-bg-secondary)', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--clr-text)' }}>{analytics.topCategory}</div>
                  <div style={{ fontSize: 10, color: 'var(--clr-text-tertiary)' }}>Top category</div>
                </div>
                <div style={{ padding: '6px 8px', backgroundColor: 'var(--clr-bg-secondary)', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--clr-text)' }}>{analytics.daysCount}</div>
                  <div style={{ fontSize: 10, color: 'var(--clr-text-tertiary)' }}>Days tracked</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--clr-text-tertiary)' }}>No data yet</div>
            )}
          </div>
          <button
            onClick={() => { navigate(ROUTES.ANALYTICS); setOpen(false) }}
            style={menuItem}
          >
            <BarChart3 size={14} />
            View full report
          </button>

          <div style={{ height: 1, backgroundColor: 'var(--clr-border)', margin: '4px 12px' }} />

          {/* Data */}
          <div style={sectionLabel}>Data</div>
          <div style={{ display: 'flex', gap: 4, padding: '4px 12px 8px' }}>
            <button onClick={handleExportJSON} style={{
              ...menuItem, justifyContent: 'center', padding: '5px 8px', fontSize: 12,
            }}>
              <Download size={12} /> JSON
            </button>
            <button onClick={handleExportCSV} style={{
              ...menuItem, justifyContent: 'center', padding: '5px 8px', fontSize: 12,
            }}>
              <Download size={12} /> CSV
            </button>
          </div>


        </div>
      )}
    </div>
  )
}
