import { TABLES } from '../store/constants'
import { withRetry } from './retry'

const RULES_FIELDS = 'id,days_of_week,start_min,duration,label,category,active_until'

function ruleFromDb(row) {
  return {
    id: row.id,
    daysOfWeek: row.days_of_week,
    startMin: row.start_min,
    duration: row.duration,
    label: row.label,
    category: row.category,
    activeUntil: row.active_until,
  }
}

function ruleToDb(rule, userId) {
  return {
    id: rule.id,
    user_id: userId,
    days_of_week: rule.daysOfWeek,
    start_min: rule.startMin,
    duration: rule.duration,
    label: rule.label,
    category: rule.category,
    active_until: rule.activeUntil || null,
  }
}

export async function fetchRules(supabase) {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from(TABLES.RULES)
      .select(RULES_FIELDS)

    if (error) throw error
    return (data || []).map(ruleFromDb)
  })
}

export async function addRule(supabase, rule, userId) {
  if (!userId) throw new Error('userId required for addRule')
  return withRetry(async () => {
    const dbRule = ruleToDb(rule, userId)
    const { error } = await supabase
      .from(TABLES.RULES)
      .insert(dbRule)

    if (error) throw error
  })
}

export async function updateRule(supabase, id, changes) {
  return withRetry(async () => {
    const updates = {}
    if (changes.daysOfWeek != null) updates.days_of_week = changes.daysOfWeek
    if (changes.startMin != null) updates.start_min = changes.startMin
    if (changes.duration != null) updates.duration = changes.duration
    if (changes.label != null) updates.label = changes.label
    if (changes.category != null) updates.category = changes.category
    if (changes.activeUntil !== undefined) updates.active_until = changes.activeUntil || null

    const { error } = await supabase
      .from(TABLES.RULES)
      .update(updates)
      .eq('id', id)

    if (error) throw error
  })
}

export async function deleteRule(supabase, id) {
  return withRetry(async () => {
    const { error } = await supabase
      .from(TABLES.RULES)
      .delete()
      .eq('id', id)

    if (error) throw error
  })
}
