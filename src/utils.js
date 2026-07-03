export function minutesToStr(m) {
  const h = Math.floor(((m % 1440) + 1440) % 1440 / 60)
  const min = ((m % 1440) + 1440) % 1440 % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export function formatDuration(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function snapToGrid(minutes, snapMinutes = 15) {
  return Math.round(minutes / snapMinutes) * snapMinutes
}

export function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
