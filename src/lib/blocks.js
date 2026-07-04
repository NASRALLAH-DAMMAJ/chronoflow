const DB_FIELDS = 'id,date,start_min,duration,label,category,is_recurring,parent_rule_id'

function blockToDb(block, dateStr) {
  const wraps = block.end <= block.start
  return {
    id: block.id,
    date: dateStr,
    start_min: block.start,
    duration: wraps ? block.end + 1440 - block.start : block.end - block.start,
    label: block.label,
    category: block.category,
    is_recurring: block.is_recurring || false,
    parent_rule_id: block.parent_rule_id || null,
  }
}

function blockFromDb(row) {
  const end = row.start_min + row.duration
  return {
    id: row.id,
    start: row.start_min,
    end: end >= 1440 ? end - 1440 : end,
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

export async function upsertBlocks(supabase, dateStr, blocks) {
  const dbBlocks = blocks.map(b => blockToDb(b, dateStr))
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
