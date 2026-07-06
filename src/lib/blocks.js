import { MINUTES_IN_DAY, TABLES, BLOCK_CATEGORIES } from '../store/constants'
import { withRetry } from './retry'

const DB_FIELDS = 'id,date,start_min,duration,label,category,is_recurring,parent_rule_id,locked'

export function validateBlockForDb(block) {
  if (!block) return 'Block is required'
  if (!block.label || typeof block.label !== 'string' || block.label.trim().length === 0) {
    return 'Label is required'
  }
  if (block.label.length > 100) return 'Label must be 100 characters or less'
  if (!block.category || !BLOCK_CATEGORIES.includes(block.category)) {
    return `Invalid category: ${block.category}`
  }
  if (typeof block.start !== 'number' || block.start < 0 || block.start >= MINUTES_IN_DAY) {
    return `Invalid start: ${block.start}`
  }
  if (typeof block.end !== 'number' || block.end < 0 || block.end > MINUTES_IN_DAY) {
    return `Invalid end: ${block.end}`
  }
  if (block.start === block.end) return 'Block must have a duration'
  return null
}

export function blockToDb(block, dateStr, userId) {
  const wraps = block.end <= block.start
  const duration = wraps ? block.end + MINUTES_IN_DAY - block.start : block.end - block.start
  if (duration <= 0 || duration > MINUTES_IN_DAY) {
    throw new Error(`Invalid block duration: ${duration} minutes`)
  }
  return {
    id: block.id,
    user_id: userId,
    date: dateStr,
    start_min: Math.round(block.start),
    duration: Math.round(duration),
    label: block.label.trim(),
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
    end: end > MINUTES_IN_DAY ? end - MINUTES_IN_DAY : end,
    label: row.label,
    category: row.category,
    is_recurring: row.is_recurring || false,
    parent_rule_id: row.parent_rule_id || null,
    locked: row.locked || false,
  }
}

export async function fetchBlocks(supabase, dateStr) {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from(TABLES.BLOCKS)
      .select(DB_FIELDS)
      .eq('date', dateStr)
      .eq('archived', false)
      .order('start_min', { ascending: true })

    if (error) throw error
    return (data || []).map(blockFromDb)
  })
}

export async function upsertBlocks(supabase, dateStr, blocks, userId) {
  if (!userId) throw new Error('userId required for upsertBlocks')
  if (!blocks || blocks.length === 0) return

  const errors = []
  const validBlocks = []
  for (const block of blocks) {
    const err = validateBlockForDb(block)
    if (err) {
      errors.push({ block: block.label || block.id, error: err })
    } else {
      validBlocks.push(block)
    }
  }
  if (errors.length > 0) {
    console.error('[blocks] Validation errors:', errors)
  }
  if (validBlocks.length === 0) return

  return withRetry(async () => {
    const dbBlocks = validBlocks.map(b => blockToDb(b, dateStr, userId))
    const { error } = await supabase
      .from(TABLES.BLOCKS)
      .upsert(dbBlocks, { onConflict: 'id' })

    if (error) throw error
  })
}

export async function fetchBlocksByRule(supabase, ruleId) {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from(TABLES.BLOCKS)
      .select(DB_FIELDS)
      .eq('parent_rule_id', ruleId)
      .eq('archived', false)

    if (error) throw error
    const blocks = (data || []).map(blockFromDb)
    return { count: blocks.length, blocks }
  })
}

export async function deleteBlock(supabase, id) {
  if (!id) throw new Error('Block id required for delete')
  return withRetry(async () => {
    const { error } = await supabase
      .from(TABLES.BLOCKS)
      .delete()
      .eq('id', id)

    if (error) throw error
  })
}

export async function archiveBlock(supabase, id) {
  if (!id) throw new Error('Block id required for archive')
  return withRetry(async () => {
    const { error } = await supabase
      .from(TABLES.BLOCKS)
      .update({ archived: true })
      .eq('id', id)

    if (error) throw error
  })
}

export async function restoreBlock(supabase, id) {
  if (!id) throw new Error('Block id required for restore')
  return withRetry(async () => {
    const { error } = await supabase
      .from(TABLES.BLOCKS)
      .update({ archived: false })
      .eq('id', id)

    if (error) throw error
  })
}

export async function restoreBlockToDate(supabase, id, date) {
  if (!id) throw new Error('Block id required for restore')
  return withRetry(async () => {
    const { error } = await supabase
      .from(TABLES.BLOCKS)
      .update({ archived: false, date })
      .eq('id', id)

    if (error) throw error
  })
}

export async function fetchArchivedBlockById(supabase, userId, id) {
  if (!id) throw new Error('Block id required')
  return withRetry(async () => {
    const { data, error } = await supabase
      .from(TABLES.BLOCKS)
      .select(ARCHIVED_FIELDS)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data ? archivedBlockFromDb(data) : null
  })
}

const ARCHIVED_FIELDS = 'id,date,start_min,duration,label,category,is_recurring,parent_rule_id,archived,locked'

export function archivedBlockFromDb(row) {
  const end = row.start_min + row.duration
  return {
    id: row.id,
    date: row.date,
    start: row.start_min,
    end: end > MINUTES_IN_DAY ? end - MINUTES_IN_DAY : end,
    label: row.label,
    category: row.category,
    is_recurring: row.is_recurring || false,
    parent_rule_id: row.parent_rule_id || null,
  }
}

export async function fetchArchivedBlocks(supabase, userId, filters = {}) {
  return withRetry(async () => {
    let query = supabase
      .from(TABLES.BLOCKS)
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
  })
}
