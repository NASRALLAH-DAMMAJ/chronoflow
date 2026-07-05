import { fetchBlocks, fetchArchivedBlocks } from './blocks'
import { fetchRules } from './recurringRules'
import { fetchSettings } from './settings'

export async function exportToJSON(supabase, userId) {
  const [blocks, archivedBlocks, rules, settings] = await Promise.all([
    fetchBlocksForExport(supabase, userId),
    fetchArchivedBlocks(supabase, userId),
    fetchRules(supabase),
    fetchSettings(supabase, userId),
  ])

  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    userId,
    blocks,
    archivedBlocks,
    recurringRules: rules,
    settings,
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `chronoflow-export-${new Date().toISOString().slice(0, 10)}.json`)
}

export async function exportToCSV(supabase, userId, dateFrom, dateTo) {
  const blocks = await fetchBlocksForExport(supabase, userId, dateFrom, dateTo)

  const headers = ['Date', 'Start', 'End', 'Duration (min)', 'Label', 'Category', 'Recurring', 'Locked']
  const rows = blocks.map(b => [
    b.date,
    formatMinutes(b.start_min),
    formatMinutes(b.start_min + b.duration),
    b.duration,
    `"${b.label.replace(/"/g, '""')}"`,
    b.category,
    b.is_recurring ? 'Yes' : 'No',
    b.locked ? 'Yes' : 'No',
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, `chronoflow-blocks-${dateFrom || 'all'}-${dateTo || 'all'}.csv`)
}

export async function importFromJSON(supabase, userId, file) {
  const text = await file.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Invalid JSON file')
  }

  if (!data.version || !data.blocks) {
    throw new Error('Invalid ChronoFlow export file')
  }

  const results = { blocks: 0, rules: 0, settings: false, errors: [] }

  if (data.blocks && Array.isArray(data.blocks)) {
    for (const block of data.blocks) {
      try {
        const { error } = await supabase.from('blocks').upsert({
          id: block.id,
          user_id: userId,
          date: block.date,
          start_min: block.start_min,
          duration: block.duration,
          label: block.label,
          category: block.category,
          is_recurring: block.is_recurring || false,
          parent_rule_id: block.parent_rule_id || null,
          archived: block.archived || false,
        }, { onConflict: 'id' })
        if (error) results.errors.push(`Block: ${error.message}`)
        else results.blocks++
      } catch (e) {
        results.errors.push(`Block: ${e.message}`)
      }
    }
  }

  if (data.recurringRules && Array.isArray(data.recurringRules)) {
    for (const rule of data.recurringRules) {
      try {
        const { error } = await supabase.from('recurring_rules').upsert({
          id: rule.id,
          user_id: userId,
          days_of_week: rule.daysOfWeek || rule.days_of_week,
          start_min: rule.startMin || rule.start_min,
          duration: rule.duration,
          label: rule.label,
          category: rule.category,
          active_until: rule.activeUntil || rule.active_until || null,
        }, { onConflict: 'id' })
        if (error) results.errors.push(`Rule: ${error.message}`)
        else results.rules++
      } catch (e) {
        results.errors.push(`Rule: ${e.message}`)
      }
    }
  }

  if (data.settings) {
    try {
      const { error } = await supabase.from('settings').upsert({
        user_id: userId,
        sleep_start: data.settings.sleep_start || data.settings.sleepStart,
        sleep_end: data.settings.sleep_end || data.settings.sleepEnd,
        theme: data.settings.theme || 'system',
      }, { onConflict: 'user_id' })
      if (error) results.errors.push(`Settings: ${error.message}`)
      else results.settings = true
    } catch (e) {
      results.errors.push(`Settings: ${e.message}`)
    }
  }

  return results
}

export async function importFromCSV(supabase, userId, file) {
  const text = await file.text()
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) throw new Error('CSV file is empty or has no data rows')

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const requiredHeaders = ['date', 'label', 'category']
  for (const h of requiredHeaders) {
    if (!headers.includes(h)) throw new Error(`Missing required column: ${h}`)
  }

  const results = { blocks: 0, errors: [] }

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row = {}
    headers.forEach((h, idx) => { row[h] = values[idx] || '' })

    try {
      const startMin = row.start ? parseTimeToMinutes(row.start) : (row.start_min ? parseInt(row.start_min) : 0)
      const duration = row['duration (min)'] ? parseInt(row['duration (min)']) : (row.duration ? parseInt(row.duration) : 60)
      const label = row.label.replace(/^"|"$/g, '')
      const category = row.category

      if (!label) throw new Error('Empty label')
      if (!category) throw new Error('Empty category')
      if (isNaN(startMin) || startMin < 0 || startMin > 1439) throw new Error('Invalid start time')
      if (isNaN(duration) || duration <= 0) throw new Error('Invalid duration')

      const { error } = await supabase.from('blocks').insert({
        user_id: userId,
        date: row.date,
        start_min: startMin,
        duration,
        label,
        category,
        is_recurring: row.recurring?.toLowerCase() === 'yes',
      })
      if (error) results.errors.push(`Row ${i + 1}: ${error.message}`)
      else results.blocks++
    } catch (e) {
      results.errors.push(`Row ${i + 1}: ${e.message}`)
    }
  }

  return results
}

function parseTimeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

async function fetchBlocksForExport(supabase, userId, dateFrom, dateTo) {
  const { data, error } = await supabase
    .from('blocks')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })
    .order('start_min', { ascending: true })

  if (error) throw error

  let blocks = data || []
  if (dateFrom) blocks = blocks.filter(b => b.date >= dateFrom)
  if (dateTo) blocks = blocks.filter(b => b.date <= dateTo)
  return blocks
}

function formatMinutes(m) {
  const h = Math.floor(((m % 1440) + 1440) % 1440 / 60)
  const min = ((m % 1440) + 1440) % 1440 % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
