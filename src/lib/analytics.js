export async function fetchBlocksForRange(supabase, userId, dateFrom, dateTo) {
  const { data, error } = await supabase
    .from('blocks')
    .select('id, date, start_min, duration, label, category, is_recurring')
    .eq('user_id', userId)
    .eq('archived', false)
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .order('date', { ascending: true })
    .order('start_min', { ascending: true })

  if (error) throw error
  return data || []
}

export async function fetchSettingsForRange(supabase, userId, _dateFrom, _dateTo) {
  const { data, error } = await supabase
    .from('settings')
    .select('sleep_start, sleep_end')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}
