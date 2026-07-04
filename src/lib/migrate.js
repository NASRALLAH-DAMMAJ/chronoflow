export async function migrateLocalStorage(supabase) {
  if (localStorage.getItem('cf-migrated')) return false

  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('cf-blocks-')) keys.push(key)
  }

  if (keys.length === 0) {
    localStorage.setItem('cf-migrated', '1')
    return false
  }

  for (const key of keys) {
    const dateStr = key.slice('cf-blocks-'.length)
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const blocks = JSON.parse(raw)
      if (blocks.length === 0) continue

      const dbBlocks = blocks.map(b => ({
        id: b.id,
        date: dateStr,
        start_min: b.start,
        duration: b.end <= b.start ? b.end + 1440 - b.start : b.end - b.start,
        label: b.label || '',
        category: b.category || 'other',
      }))

      const { error } = await supabase
        .from('blocks')
        .upsert(dbBlocks, { onConflict: 'id' })

      if (error) console.error('Migration failed for', dateStr, error)
    } catch (e) {
      console.error('Migration error for', key, e)
    }
  }

  localStorage.setItem('cf-migrated', '1')
  return true
}
