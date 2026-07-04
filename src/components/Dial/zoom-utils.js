import { MINUTES_IN_DAY } from '../../store/constants'

export function toRenderMinute(worldMinute, zoomRange) {
  if (!zoomRange) return worldMinute
  const { start, end } = zoomRange
  const range = end - start
  if (range <= 0) return worldMinute
  return ((worldMinute - start + MINUTES_IN_DAY) % MINUTES_IN_DAY) / range * MINUTES_IN_DAY
}

export function toWorldMinute(renderMinute, zoomRange) {
  if (!zoomRange) return renderMinute
  const { start, end } = zoomRange
  const range = end - start
  if (range <= 0) return renderMinute
  return start + (renderMinute / MINUTES_IN_DAY) * range
}

export function isVisible(worldMinute, zoomRange) {
  if (!zoomRange) return true
  const { start, end } = zoomRange
  if (end > start) return worldMinute >= start && worldMinute <= end
  return worldMinute >= start || worldMinute <= end
}
