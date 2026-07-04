function lsGet(key) {
  try { return localStorage.getItem(key) } catch { return null }
}

function lsSet(key, val) {
  try { localStorage.setItem(key, val) } catch {}
}

export async function migrateLocalStorage(supabase, userId) {
  if (!userId) return false
  if (lsGet('cf-migrated')) return false

  const keys = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('cf-blocks-')) keys.push(key)
    }
  } catch {
    return false
  }

  if (keys.length === 0) {
    lsSet('cf-migrated', '1')
    return false
  }

  for (const key of keys) {
    const dateStr = key.slice('cf-blocks-'.length)
    try {
      const raw = lsGet(key)
      if (!raw) continue
      const blocks = JSON.parse(raw)
      if (blocks.length === 0) continue

      const dbBlocks = blocks.map(b => ({
        id: b.id,
        user_id: userId,
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

  lsSet('cf-migrated', '1')
  return true
}
