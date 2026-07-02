export function getTodayStr(date) {
  const d = date || new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const HOURS = 24
export const MINUTES_IN_DAY = 1440
export const DEG_PER_MINUTE = 360 / MINUTES_IN_DAY
export const RAD_PER_MINUTE = (2 * Math.PI) / MINUTES_IN_DAY
export const SNAP_MINUTES = 15
export const BLOCK_CATEGORIES = [
  'work', 'sleep', 'exercise', 'meal', 'leisure',
  'family', 'commute', 'chores', 'self-care', 'other',
]

export const CATEGORY_COLORS = {
  work:      '#3B82F6',
  sleep:     '#8B5CF6',
  exercise:  '#22C55E',
  meal:      '#F59E0B',
  leisure:   '#EC4899',
  family:    '#14B8A6',
  commute:   '#F97316',
  chores:    '#A1A1AA',
  'self-care': '#06B6D4',
  other:     '#78716C',
}
