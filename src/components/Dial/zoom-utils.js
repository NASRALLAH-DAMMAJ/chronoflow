import { MINUTES_IN_DAY } from '../../store/constants'

export function toRenderMinute(worldMinute, zoomRange) {
  if (!zoomRange) return worldMinute
  const { start, end } = zoomRange
  if (end > start) {
    const range = end - start
    return ((worldMinute - start + MINUTES_IN_DAY) % MINUTES_IN_DAY) / range * MINUTES_IN_DAY
  } else if (end < start) {
    const range = MINUTES_IN_DAY - start + end
    if (worldMinute >= start) {
      return (worldMinute - start) / range * MINUTES_IN_DAY
    }
    return (MINUTES_IN_DAY - start + worldMinute) / range * MINUTES_IN_DAY
  }
  return worldMinute
}

export function toWorldMinute(renderMinute, zoomRange) {
  if (!zoomRange) return renderMinute
  const { start, end } = zoomRange
  if (end > start) {
    const range = end - start
    return start + (renderMinute / MINUTES_IN_DAY) * range
  } else if (end < start) {
    const range = MINUTES_IN_DAY - start + end
    let worldMin = start + (renderMinute / MINUTES_IN_DAY) * range
    if (worldMin >= MINUTES_IN_DAY) worldMin -= MINUTES_IN_DAY
    return worldMin
  }
  return renderMinute
}

export function isVisible(worldMinute, zoomRange) {
  if (!zoomRange) return true
  const { start, end } = zoomRange
  if (end > start) return worldMinute >= start && worldMinute <= end
  return worldMinute >= start || worldMinute <= end
}
