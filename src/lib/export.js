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
