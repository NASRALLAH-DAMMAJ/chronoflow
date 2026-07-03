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
  work:      '#60A5FA',
  sleep:     '#A78BFA',
  exercise:  '#4ADE80',
  meal:      '#FBBF24',
  leisure:   '#F472B6',
  family:    '#2DD4BF',
  commute:   '#FB923C',
  chores:    '#D4D4D8',
  'self-care': '#22D3EE',
  other:     '#A8A29E',
}
