import { MINUTES_IN_DAY, RAD_PER_MINUTE, CATEGORY_COLORS } from '../../store/constants'
import { toRenderMinute, isVisible } from './zoom-utils'

const PI = Math.PI
const TAU = 2 * PI
const DEFAULT_DURATION = 60

function renderMinuteToRadians(rm) {
  return rm * RAD_PER_MINUTE - PI / 2
}

export function drawDial(ctx, cx, cy, radius, blocks, selectedId, currentTimeMinutes, colors, zoomRange, placement, placementPos) {
  const { bg, border, text, textSecondary, primary } = colors
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  const innerR = radius * 0.6
  const arcWidth = radius - innerR

  drawBackground(ctx, cx, cy, radius, innerR, bg, border)
  drawHourTicks(ctx, cx, cy, radius, innerR, textSecondary, border, zoomRange)
  drawHourLabels(ctx, cx, cy, innerR, text, zoomRange)
  drawBlocks(ctx, cx, cy, innerR, arcWidth, blocks, selectedId, zoomRange)
  if (!zoomRange) {
    drawCurrentTime(ctx, cx, cy, innerR, arcWidth, currentTimeMinutes, primary)
  }
  if (placement && placementPos != null) {
    const rm = toRenderMinute(placementPos, zoomRange)
    const startAngle = renderMinuteToRadians(rm)
    const endAngle = renderMinuteToRadians(rm + DEFAULT_DURATION)
    const outerR = innerR + arcWidth
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, outerR, startAngle, endAngle)
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true)
    ctx.closePath()
    ctx.fillStyle = selectedBlockColor(placement, blocks) || '#3B82F6'
    ctx.globalAlpha = 0.3
    ctx.fill()
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = selectedBlockColor(placement, blocks) || '#3B82F6'
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.8
    ctx.stroke()
    ctx.restore()
  }
}

function selectedBlockColor(placement, blocks) {
  const c = CATEGORY_COLORS[placement.category]
  return c || CATEGORY_COLORS.other
}

function drawBackground(ctx, cx, cy, outerR, innerR, bg, border) {
  ctx.beginPath()
  ctx.arc(cx, cy, outerR, 0, TAU)
  ctx.arc(cx, cy, innerR, 0, TAU, true)
  ctx.closePath()
  ctx.fillStyle = bg
  ctx.fill()
  ctx.strokeStyle = border
  ctx.lineWidth = 1
  ctx.stroke()
}

function drawHourTicks(ctx, cx, cy, outerR, innerR, color, borderColor, zoomRange) {
  if (!zoomRange) {
    for (let h = 0; h < 24; h++) {
      const angle = renderMinuteToRadians(h * 60)
      const isMajor = h % 3 === 0
      const outer = outerR - (isMajor ? 6 : 3)
      const inner = innerR + (isMajor ? 6 : 3)
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner)
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer)
      ctx.strokeStyle = isMajor ? color : borderColor
      ctx.lineWidth = isMajor ? 1.5 : 1
      ctx.stroke()
    }
    return
  }

  const { start, end } = zoomRange
  const range = end - start
  const tickInterval = range > 480 ? 60 : range > 120 ? 30 : 15

  for (let m = 0; m <= range; m += tickInterval) {
    const worldMin = start + m
    const rm = toRenderMinute(worldMin, zoomRange)
    const angle = renderMinuteToRadians(rm)
    const isMajor = m % (tickInterval * (range > 480 ? 1 : range > 240 ? 2 : 4)) === 0
    const outer = outerR - (isMajor ? 6 : 3)
    const inner = innerR + (isMajor ? 6 : 3)
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner)
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer)
    ctx.strokeStyle = isMajor ? color : borderColor
    ctx.lineWidth = isMajor ? 1.5 : 1
    ctx.stroke()
  }
}

function drawHourLabels(ctx, cx, cy, innerR, color, zoomRange) {
  ctx.fillStyle = color
  ctx.font = '11px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (!zoomRange) {
    for (let h = 0; h < 24; h++) {
      if (h % 3 !== 0) continue
      const angle = renderMinuteToRadians(h * 60)
      const labelR = innerR - 20
      const x = cx + Math.cos(angle) * labelR
      const y = cy + Math.sin(angle) * labelR
      ctx.fillText(h === 0 ? '24' : String(h), x, y)
    }
    return
  }

  const { start, end } = zoomRange
  const range = end - start
  const labelInterval = range > 480 ? 120 : range > 240 ? 60 : range > 120 ? 30 : 15

  for (let m = 0; m <= range; m += labelInterval) {
    const worldMin = (start + m) % 1440
    const rm = toRenderMinute(worldMin, zoomRange)
    const angle = renderMinuteToRadians(rm)
    const labelR = innerR - 20
    const x = cx + Math.cos(angle) * labelR
    const y = cy + Math.sin(angle) * labelR
    const h = Math.floor(worldMin / 60)
    const min = worldMin % 60
    ctx.fillText(min === 0 ? String(h) : `${h}:${String(min).padStart(2, '0')}`, x, y)
  }
}

function drawBlocks(ctx, cx, cy, innerR, arcWidth, blocks, selectedId, zoomRange) {
  for (const block of blocks) {
    if (zoomRange && !isVisible(block.start, zoomRange) && !isVisible(block.end, zoomRange)) continue

    const renderStart = toRenderMinute(block.start, zoomRange)
    const renderEnd = toRenderMinute(block.end, zoomRange)
    const startAngle = renderMinuteToRadians(renderStart)
    const endAngle = renderMinuteToRadians(renderEnd)

    const isSelected = block.id === selectedId
    const outerR = innerR + arcWidth

    ctx.beginPath()
    ctx.arc(cx, cy, outerR, startAngle, endAngle)
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true)
    ctx.closePath()

    ctx.fillStyle = block.color || '#3B82F6'
    ctx.globalAlpha = isSelected ? 0.85 : 0.6
    ctx.fill()
    ctx.globalAlpha = 1

    ctx.strokeStyle = isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.3)'
    ctx.lineWidth = isSelected ? 2 : 1
    ctx.stroke()

    const duration = block.end - block.start
    if (block.label && duration > 30) {
      const midAngle = (startAngle + endAngle) / 2
      const midR = innerR + arcWidth / 2
      const x = cx + Math.cos(midAngle) * midR
      const y = cy + Math.sin(midAngle) * midR
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(midAngle + PI / 2)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 10px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const displayLabel = block.label.length > 14
        ? block.label.slice(0, 13) + '…'
        : block.label
      ctx.fillText(displayLabel, 0, 0)
      ctx.restore()
    }
  }
}

function drawCurrentTime(ctx, cx, cy, innerR, arcWidth, currentTimeMinutes, color) {
  if (currentTimeMinutes < 0) return
  const angle = renderMinuteToRadians(currentTimeMinutes)
  const r1 = innerR + 4
  const r2 = innerR + arcWidth - 4

  ctx.beginPath()
  ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1)
  ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2)
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2, 3, 0, TAU)
  ctx.fillStyle = color
  ctx.fill()
}
