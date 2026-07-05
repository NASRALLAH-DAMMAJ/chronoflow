import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabase } from '../lib/SupabaseContext'
import { fetchBlocksForRange, fetchSettingsForRange } from '../lib/analytics'
import { CATEGORY_COLORS, ROUTES, LOCALE, HALF_DAY, MINUTES_IN_DAY, SLEEP_CATEGORY, BRAND_COLOR, NO_CATEGORY } from '../store/constants'
import { Card } from '../design-system/components'
import { minutesToStr } from '../utils'
import { pdf } from '@react-pdf/renderer'
import ReportPDF from './ReportPDF'
import VisualPDF from './VisualPDF'
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

function formatDateStr(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' })
}

function circularDiff(actual, target) {
  let diff = actual - target
  if (diff > HALF_DAY) diff -= MINUTES_IN_DAY
  if (diff < -HALF_DAY) diff += MINUTES_IN_DAY
  return diff
}

function getDefaultDateFrom() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

function getDefaultDateTo() {
  return new Date().toISOString().slice(0, 10)
}

const DATE_PRESETS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
]

function getPresetRange(days) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

const tooltipContentStyle = {
  backgroundColor: 'var(--clr-surface)',
  border: '1px solid var(--clr-border)',
  borderRadius: 8,
  color: 'var(--clr-text)',
  fontSize: 12,
}

const tickStyle = { fill: 'var(--clr-text-secondary)', fontSize: 11 }

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const { supabase, user } = useSupabase()
  const [blocks, setBlocks] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom)
  const [dateTo, setDateTo] = useState(getDefaultDateTo)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [blockData, settingsData] = await Promise.all([
          fetchBlocksForRange(supabase, user.id, dateFrom, dateTo),
          fetchSettingsForRange(supabase, user.id, dateFrom, dateTo),
        ])
        if (!cancelled) {
          setBlocks(blockData)
          setSettings(settingsData)
        }
      } catch (e) {
        console.error('Failed to load analytics:', e)
        if (!cancelled) setError(e.message || 'Failed to load analytics')
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [supabase, user, dateFrom, dateTo])

  const categories = Object.keys(CATEGORY_COLORS)

  const pieData = useMemo(() => {
    const totals = {}
    for (const block of blocks) {
      const hours = block.duration / 60
      totals[block.category] = (totals[block.category] || 0) + hours
    }
    return categories
      .filter(c => (totals[c] || 0) > 0)
      .map(c => ({ name: c, value: Math.round(totals[c] * 100) / 100 }))
  }, [blocks, categories])

  const dailyData = useMemo(() => {
    const byDate = {}
    for (const block of blocks) {
      if (!byDate[block.date]) byDate[block.date] = {}
      const hours = block.duration / 60
      byDate[block.date][block.category] = (byDate[block.date][block.category] || 0) + hours
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, cats]) => ({
        date: formatDateStr(date),
        ...Object.fromEntries(
          categories.map(c => [c, Math.round((cats[c] || 0) * 100) / 100])
        ),
      }))
  }, [blocks, categories])

  const sleepData = useMemo(() => {
    if (!settings) return null
    const sleepBlocks = blocks.filter(b => b.category === SLEEP_CATEGORY)
    if (sleepBlocks.length === 0) return null
    let bedtimeDevSum = 0
    let wakeDevSum = 0
    for (const block of sleepBlocks) {
      const bedtime = block.start_min
      const wake = (block.start_min + block.duration) % MINUTES_IN_DAY
      bedtimeDevSum += Math.abs(circularDiff(bedtime, settings.sleep_start))
      wakeDevSum += Math.abs(circularDiff(wake, settings.sleep_end))
    }
    return {
      count: sleepBlocks.length,
      avgBedtimeDev: Math.round(bedtimeDevSum / sleepBlocks.length),
      avgWakeDev: Math.round(wakeDevSum / sleepBlocks.length),
    }
  }, [blocks, settings])

  const trendData = useMemo(() => {
    if (dailyData.length < 2) return null
    const n = dailyData.length
    const totalPerDay = dailyData.map(d => {
      let total = 0
      for (const c of categories) total += (d[c] || 0)
      return Math.round(total * 100) / 100
    })
    const xVals = totalPerDay.map((_, i) => i)
    const sumX = xVals.reduce((a, b) => a + b, 0)
    const sumY = totalPerDay.reduce((a, b) => a + b, 0)
    const sumXY = xVals.reduce((s, x, i) => s + x * totalPerDay[i], 0)
    const sumX2 = xVals.reduce((s, x) => s + x * x, 0)
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0
    const intercept = (sumY - slope * sumX) / n
    return dailyData.map((d, i) => ({
      date: d.date,
      total: totalPerDay[i],
      trend: Math.round((slope * i + intercept) * 100) / 100,
    }))
  }, [dailyData, categories])

  const heatmapData = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const byDow = {}
    for (const block of blocks) {
      const dow = new Date(block.date + 'T00:00:00').getDay()
      if (!byDow[dow]) byDow[dow] = 0
      byDow[dow] += block.duration / 60
    }
    const daysWithBlocks = new Set(blocks.map(b => b.date)).size || 1
    return dayNames.map((name, i) => ({
      day: name,
      hours: Math.round((byDow[i] || 0) / daysWithBlocks * 10) / 10,
      dow: i,
    }))
  }, [blocks])

  const cumulativeData = useMemo(() => {
    let cumulative = 0
    return dailyData.map(d => {
      let total = 0
      for (const c of categories) total += (d[c] || 0)
      cumulative += total
      return { date: d.date, cumulative: Math.round(cumulative * 10) / 10 }
    })
  }, [dailyData, categories])

  const productivityScore = useMemo(() => {
    if (blocks.length === 0) return null
    const productiveCats = ['work', 'study', 'exercise', 'creative']
    const totalHours = blocks.reduce((s, b) => s + b.duration / 60, 0)
    const productiveHours = blocks
      .filter(b => productiveCats.includes(b.category))
      .reduce((s, b) => s + b.duration / 60, 0)
    const score = totalHours > 0 ? Math.round((productiveHours / totalHours) * 100) : 0
    const uniqueDates = new Set(blocks.map(b => b.date)).size || 1
    const avgPerDay = Math.round(totalHours / uniqueDates * 10) / 10
    return { score, productiveHours: Math.round(productiveHours * 10) / 10, totalHours: Math.round(totalHours * 10) / 10, avgPerDay }
  }, [blocks])

  const summary = useMemo(() => {
    const totalHours = blocks.reduce((s, b) => s + b.duration / 60, 0)
    const uniqueDates = new Set(blocks.map(b => b.date))
    const daysCount = uniqueDates.size
    const avgHours = daysCount > 0 ? totalHours / daysCount : 0
    const catHours = {}
    for (const block of blocks) {
      catHours[block.category] = (catHours[block.category] || 0) + block.duration / 60
    }
    let topCategory = NO_CATEGORY
    let topHours = 0
    for (const [cat, hrs] of Object.entries(catHours)) {
      if (hrs > topHours) {
        topHours = hrs
        topCategory = cat
      }
    }
    return {
      totalHours: Math.round(totalHours * 10) / 10,
      avgHours: Math.round(avgHours * 10) / 10,
      topCategory,
      daysCount,
    }
  }, [blocks])

  async function handleDownload(Component) {
    const blob = await pdf(
      <Component blocks={blocks} dateFrom={dateFrom} dateTo={dateTo} settings={settings} />
    ).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chronoflow-${dateFrom}-${dateTo}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div style={{ padding: 24, color: 'var(--clr-text-secondary)', fontSize: 14 }}>
        Loading analytics...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--sp-6) var(--sp-4)' }}>
        <div style={{
          backgroundColor: '#fee2e2', border: '1px solid #fca5a5',
          color: '#991b1b', padding: '16px 20px', borderRadius: 8,
          fontSize: 14, marginBottom: 16,
        }}>
          <strong>Error:</strong> {error}
          <button
            onClick={() => { setError(null); setLoading(true) }}
            style={{
              marginLeft: 12, padding: '4px 12px', fontSize: 13,
              backgroundColor: '#fff', border: '1px solid #fca5a5',
              borderRadius: 4, cursor: 'pointer', color: '#991b1b',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--sp-6) var(--sp-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate(ROUTES.HOME)} style={{
          border: 'none', background: 'none',
          color: 'var(--clr-text-tertiary)', cursor: 'pointer', fontSize: 16, padding: 4,
        }}>←</button>
        <h1 style={{ fontSize: 'var(--fs-subtitle)', fontWeight: 600, color: 'var(--clr-text)', margin: 0 }}>
          Analytics
        </h1>
      </div>

      <Card padding="var(--sp-4)" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
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
          <div style={{ display: 'flex', gap: 4 }}>
            {DATE_PRESETS.map(preset => {
              const range = getPresetRange(preset.days)
              const isActive = dateFrom === range.from && dateTo === range.to
              return (
                <button
                  key={preset.label}
                  onClick={() => { setDateFrom(range.from); setDateTo(range.to) }}
                  style={{
                    padding: '5px 10px', fontSize: 11, fontWeight: isActive ? 600 : 400,
                    fontFamily: 'var(--ff-body)',
                    color: isActive ? '#fff' : 'var(--clr-text-secondary)',
                    backgroundColor: isActive ? BRAND_COLOR : 'transparent',
                    border: `1px solid ${isActive ? BRAND_COLOR : 'var(--clr-border)'}`,
                    borderRadius: 4, cursor: 'pointer',
                  }}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignSelf: 'end' }}>
            <button onClick={() => handleDownload(ReportPDF)} style={{
              padding: '5px 12px', fontSize: 12, fontWeight: 600,
              fontFamily: 'var(--ff-body)',
              color: '#fff', backgroundColor: BRAND_COLOR,
              border: 'none', borderRadius: 6, cursor: 'pointer',
            }}>
              Download Report
            </button>
            <button onClick={() => handleDownload(VisualPDF)} style={{
              padding: '5px 12px', fontSize: 12, fontWeight: 600,
              fontFamily: 'var(--ff-body)',
              color: BRAND_COLOR, backgroundColor: 'transparent',
              border: `2px solid ${BRAND_COLOR}`, borderRadius: 6, cursor: 'pointer',
            }}>
              Download Visual
            </button>
          </div>
        </div>
      </Card>

      <Card padding="var(--sp-4)" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', margin: '0 0 16px' }}>
          Monthly Summary
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <div style={{ padding: 12, backgroundColor: 'var(--clr-bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--clr-text)' }}>{summary.totalHours}</div>
            <div style={{ fontSize: 11, color: 'var(--clr-text-tertiary)' }}>Total hours</div>
          </div>
          <div style={{ padding: 12, backgroundColor: 'var(--clr-bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--clr-text)' }}>{summary.avgHours}</div>
            <div style={{ fontSize: 11, color: 'var(--clr-text-tertiary)' }}>Avg hrs/day</div>
          </div>
          <div style={{ padding: 12, backgroundColor: 'var(--clr-bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--clr-text)' }}>{summary.topCategory}</div>
            <div style={{ fontSize: 11, color: 'var(--clr-text-tertiary)' }}>Top category</div>
          </div>
          <div style={{ padding: 12, backgroundColor: 'var(--clr-bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--clr-text)' }}>{summary.daysCount}</div>
            <div style={{ fontSize: 11, color: 'var(--clr-text-tertiary)' }}>Days with blocks</div>
          </div>
        </div>
      </Card>

      <Card padding="var(--sp-4)" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', margin: '0 0 16px' }}>
          Category Breakdown
        </h2>
        {pieData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--clr-text-tertiary)', fontSize: 13 }}>
            No data for the selected period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}h`}
              >
                {pieData.map(entry => (
                  <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS.other} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipContentStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--clr-text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card padding="var(--sp-4)" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', margin: '0 0 16px' }}>
          Daily Totals
        </h2>
        {dailyData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--clr-text-tertiary)', fontSize: 13 }}>
            No data for the selected period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <XAxis dataKey="date" tick={tickStyle} />
              <YAxis tick={tickStyle} />
              <Tooltip contentStyle={tooltipContentStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--clr-text-secondary)' }} />
              {categories.filter(c => dailyData.some(d => (d[c] || 0) > 0)).map(c => (
                <Bar key={c} dataKey={c} stackId="1" fill={CATEGORY_COLORS[c] || CATEGORY_COLORS.other} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {settings && sleepData && (
        <Card padding="var(--sp-4)" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', margin: '0 0 16px' }}>
            Sleep Consistency
          </h2>
          <div style={{ fontSize: 13, color: 'var(--clr-text-secondary)', marginBottom: 12 }}>
            Target: bed at {minutesToStr(settings.sleep_start)} · wake at {minutesToStr(settings.sleep_end)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: 12, backgroundColor: 'var(--clr-bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--clr-text)' }}>
                {sleepData.avgBedtimeDev}m
              </div>
              <div style={{ fontSize: 11, color: 'var(--clr-text-tertiary)' }}>Avg bedtime deviation</div>
            </div>
            <div style={{ padding: 12, backgroundColor: 'var(--clr-bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--clr-text)' }}>
                {sleepData.avgWakeDev}m
              </div>
              <div style={{ fontSize: 11, color: 'var(--clr-text-tertiary)' }}>Avg wake deviation</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--clr-text-tertiary)', marginTop: 8 }}>
            Based on {sleepData.count} sleep block{sleepData.count !== 1 ? 's' : ''}
          </div>
        </Card>
      )}

      {trendData && (
        <Card padding="var(--sp-4)" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', margin: '0 0 16px' }}>
            Daily Hours Trend
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" tick={tickStyle} />
              <YAxis tick={tickStyle} />
              <Tooltip contentStyle={tooltipContentStyle} />
              <Line type="monotone" dataKey="total" stroke={BRAND_COLOR} strokeWidth={2} dot={false} name="Daily hours" />
              <Line type="monotone" dataKey="trend" stroke="#94a3b8" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Trend" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card padding="var(--sp-4)" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', margin: '0 0 16px' }}>
          Day of Week Average
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={heatmapData}>
            <XAxis dataKey="day" tick={tickStyle} />
            <YAxis tick={tickStyle} />
            <Tooltip contentStyle={tooltipContentStyle} formatter={v => [`${v}h`, 'Avg hours']} />
            <Bar dataKey="hours" fill={BRAND_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {cumulativeData.length > 0 && (
        <Card padding="var(--sp-4)" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', margin: '0 0 16px' }}>
            Cumulative Hours Tracked
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={cumulativeData}>
              <XAxis dataKey="date" tick={tickStyle} />
              <YAxis tick={tickStyle} />
              <Tooltip contentStyle={tooltipContentStyle} formatter={v => [`${v}h`, 'Total']} />
              <Line type="monotone" dataKey="cumulative" stroke={BRAND_COLOR} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {productivityScore && (
        <Card padding="var(--sp-4)" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-text)', margin: '0 0 16px' }}>
            Productivity Score
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            <div style={{ padding: 16, backgroundColor: 'var(--clr-bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: productivityScore.score >= 50 ? '#059669' : '#dc2626' }}>
                {productivityScore.score}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--clr-text-tertiary)' }}>Productive ratio</div>
            </div>
            <div style={{ padding: 12, backgroundColor: 'var(--clr-bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--clr-text)' }}>{productivityScore.productiveHours}h</div>
              <div style={{ fontSize: 11, color: 'var(--clr-text-tertiary)' }}>Productive hours</div>
            </div>
            <div style={{ padding: 12, backgroundColor: 'var(--clr-bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--clr-text)' }}>{productivityScore.avgPerDay}h</div>
              <div style={{ fontSize: 11, color: 'var(--clr-text-tertiary)' }}>Avg per day</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--clr-text-tertiary)', marginTop: 8 }}>
            Based on work, study, exercise, and creative categories
          </div>
        </Card>
      )}
    </div>
  )
}
