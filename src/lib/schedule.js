function blockFromDb(row) {
  const end = row.start_min + row.duration
  return {
    id: row.id,
    start: row.start_min,
    end: end >= 1440 ? end - 1440 : end,
    label: row.label,
    category: row.category,
  }
}

export async function fetchSchedule(supabase, dateStr) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No session')

  const { data, error } = await supabase.functions.invoke('generate-schedule', {
    body: { user_id: session.user.id, date: dateStr },
  })

  if (error) throw new Error(`Schedule function error: ${error.message}`)

  return (data.blocks || []).map(blockFromDb)
}
