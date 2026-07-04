export async function fetchSettings(supabase, userId) {
  const { data, error } = await supabase
    .from('settings')
    .select('sleep_start, sleep_end, theme, timezone')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function upsertSettings(supabase, userId, settings) {
  const payload = {
    user_id: userId,
    sleep_start: settings.sleepStart,
    sleep_end: settings.sleepEnd,
    theme: settings.theme || 'system',
    timezone: settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
  const { error } = await supabase
    .from('settings')
    .upsert(payload, { onConflict: 'user_id' })

  if (error) throw error
}
