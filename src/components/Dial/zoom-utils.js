export function toRenderMinute(worldMinute, zoomRange) {
  if (!zoomRange) return worldMinute
  const { start, end } = zoomRange
  const range = end - start
  if (range <= 0) return worldMinute
  return ((worldMinute - start + 1440) % 1440) / range * 1440
}

export function toWorldMinute(renderMinute, zoomRange) {
  if (!zoomRange) return renderMinute
  const { start, end } = zoomRange
  const range = end - start
  if (range <= 0) return renderMinute
  return start + (renderMinute / 1440) * range
}

export function isVisible(worldMinute, zoomRange) {
  if (!zoomRange) return true
  const { start, end } = zoomRange
  if (end > start) return worldMinute >= start && worldMinute <= end
  return worldMinute >= start || worldMinute <= end
}

export function clampToRange(worldMinute, zoomRange) {
  if (!zoomRange) return worldMinute
  const { start, end } = zoomRange
  if (worldMinute < start) return start
  if (worldMinute > end) return end
  return worldMinute
}
