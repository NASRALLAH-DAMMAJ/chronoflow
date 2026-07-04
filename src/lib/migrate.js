import { LS_KEYS, TABLES, MINUTES_IN_DAY, DEFAULT_CATEGORY } from '../store/constants'

function lsGet(key) {
  try { return localStorage.getItem(key) } catch { return null }
}

function lsSet(key, val) {
  try { localStorage.setItem(key, val) } catch {}
}

export async function migrateLocalStorage(supabase, userId) {
  if (!userId) return false
  if (lsGet(LS_KEYS.MIGRATED)) return false

  const keys = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(LS_KEYS.BLOCKS_PREFIX)) keys.push(key)
    }
  } catch {
    return false
  }

  if (keys.length === 0) {
    lsSet(LS_KEYS.MIGRATED, '1')
    return false
  }

  for (const key of keys) {
    const dateStr = key.slice(LS_KEYS.BLOCKS_PREFIX.length)
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
        duration: b.end <= b.start ? b.end + MINUTES_IN_DAY - b.start : b.end - b.start,
        label: b.label || '',
        category: b.category || DEFAULT_CATEGORY,
      }))

      const { error } = await supabase
        .from(TABLES.BLOCKS)
        .upsert(dbBlocks, { onConflict: 'id' })

      if (error) console.error('Migration failed for', dateStr, error)
    } catch (e) {
      console.error('Migration error for', key, e)
    }
  }

  lsSet(LS_KEYS.MIGRATED, '1')
  return true
}
