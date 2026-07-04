const DB_FIELDS = 'id,date,start_min,duration,label,category,is_recurring,parent_rule_id'

export function blockToDb(block, dateStr, userId) {
  const wraps = block.end <= block.start
  return {
    id: block.id,
    user_id: userId,
    date: dateStr,
    start_min: block.start,
    duration: wraps ? block.end + 1440 - block.start : block.end - block.start,
    label: block.label,
    category: block.category,
    is_recurring: block.is_recurring || false,
    parent_rule_id: block.parent_rule_id || null,
  }
}

export function blockFromDb(row) {
  const end = row.start_min + row.duration
  return {
    id: row.id,
    start: row.start_min,
    end: end > 1440 ? end - 1440 : end,
    label: row.label,
    category: row.category,
    is_recurring: row.is_recurring || false,
    parent_rule_id: row.parent_rule_id || null,
  }
}

export async function fetchBlocks(supabase, dateStr) {
  const { data, error } = await supabase
    .from('blocks')
    .select(DB_FIELDS)
    .eq('date', dateStr)
    .eq('archived', false)

  if (error) throw error
  return (data || []).map(blockFromDb)
}

export async function upsertBlocks(supabase, dateStr, blocks, userId) {
  if (!userId) throw new Error('userId required for upsertBlocks')
  const dbBlocks = blocks.map(b => blockToDb(b, dateStr, userId))
  const { error } = await supabase
    .from('blocks')
    .upsert(dbBlocks, { onConflict: 'id' })

  if (error) throw error
}

export async function deleteBlock(supabase, id) {
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function archiveBlock(supabase, id) {
  const { error } = await supabase
    .from('blocks')
    .update({ archived: true })
    .eq('id', id)

  if (error) throw error
}

export async function restoreBlock(supabase, id) {
  const { error } = await supabase
    .from('blocks')
    .update({ archived: false })
    .eq('id', id)

  if (error) throw error
}

const ARCHIVED_FIELDS = 'id,date,start_min,duration,label,category,is_recurring,parent_rule_id,archived'

export function archivedBlockFromDb(row) {
  const end = row.start_min + row.duration
  return {
    id: row.id,
    date: row.date,
    start: row.start_min,
    end: end > 1440 ? end - 1440 : end,
    label: row.label,
    category: row.category,
    is_recurring: row.is_recurring || false,
    parent_rule_id: row.parent_rule_id || null,
  }
}

export async function fetchArchivedBlocks(supabase, userId, filters = {}) {
  let query = supabase
    .from('blocks')
    .select(ARCHIVED_FIELDS)
    .eq('user_id', userId)
    .eq('archived', true)

  if (filters.dateFrom) query = query.gte('date', filters.dateFrom)
  if (filters.dateTo) query = query.lte('date', filters.dateTo)
  if (filters.category) query = query.eq('category', filters.category)

  query = query.order('date', { ascending: false }).order('start_min', { ascending: true })

  if (filters.limit) query = query.limit(filters.limit)
  if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)

  const { data, error } = await query

  if (error) throw error
  return (data || []).map(archivedBlockFromDb)
}
