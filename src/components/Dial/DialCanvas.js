import { RAD_PER_MINUTE, CATEGORY_COLORS } from '../../store/constants'
import { toRenderMinute, isVisible } from './zoom-utils'

const PI = Math.PI
const TAU = 2 * PI

function renderMinuteToRadians(rm) {
  return rm * RAD_PER_MINUTE - PI / 2
}

function minutesToStr(m) {
  const h = Math.floor(((m % 1440) + 1440) % 1440 / 60)
  const min = ((m % 1440) + 1440) % 1440 % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export function drawDial(ctx, cx, cy, radius, blocks, selectedId, currentTimeMinutes, colors, zoomRange, placement, placementPos, placementStart) {
  const { bg, border, text, textSecondary, primary, surface } = colors
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  const innerR = radius * 0.55
  const arcWidth = radius - innerR

  drawBackground(ctx, cx, cy, radius, innerR, bg, border, surface)
  drawHourTicks(ctx, cx, cy, radius, innerR, textSecondary, border, zoomRange)
  drawHourLabels(ctx, cx, cy, innerR, text, zoomRange)
  drawBlocks(ctx, cx, cy, innerR, arcWidth, blocks, selectedId, zoomRange)
  drawCurrentTime(ctx, cx, cy, innerR, arcWidth, currentTimeMinutes, primary)

  if (placement && placementPos != null) {
    drawPlacement(ctx, cx, cy, innerR, arcWidth, placement, placementStart, placementPos, zoomRange)
  }

  drawCenterInfo(ctx, cx, cy, innerR, blocks, currentTimeMinutes, text, textSecondary, primary, surface || bg)
}

function drawBackground(ctx, cx, cy, outerR, innerR, bg, border, surface) {
  ctx.beginPath()
  ctx.arc(cx, cy, outerR, 0, TAU)
  ctx.arc(cx, cy, innerR, 0, TAU, true)
  ctx.closePath()
  ctx.fillStyle = bg
  ctx.fill()
  ctx.strokeStyle = border
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, innerR - 1, 0, TAU)
  ctx.fillStyle = surface || bg
  ctx.fill()
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
      const labelR = innerR - 18
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
    const labelR = innerR - 18
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
    let startAngle = renderMinuteToRadians(renderStart)
    let endAngle = renderMinuteToRadians(renderEnd)

    if (renderEnd <= renderStart) endAngle += 2 * PI

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
    if (block.is_recurring) ctx.setLineDash([3, 3])
    ctx.stroke()
    if (block.is_recurring) ctx.setLineDash([])

    const duration = block.end <= block.start ? block.end + 1440 - block.start : block.end - block.start
    if (block.label && duration > 30) {
      const midAngle = (startAngle + endAngle) / 2
      const midR = innerR + arcWidth / 2
      const x = cx + Math.cos(midAngle) * midR
      const y = cy + Math.sin(midAngle) * midR
      ctx.save()
      ctx.translate(x, y)
      let rot = midAngle + PI / 2
      while (rot > PI / 2) rot -= PI
      while (rot < -PI / 2) rot += PI
      ctx.rotate(rot)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 10px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const displayLabel = block.label.length > 14
        ? block.label.slice(0, 13) + '…'
        : block.label
      ctx.fillText(displayLabel + (block.is_recurring ? ' ↻' : ''), 0, 0)
      ctx.restore()
    }
  }
}

function drawCurrentTime(ctx, cx, cy, innerR, arcWidth, currentTimeMinutes, color) {
  if (!currentTimeMinutes && currentTimeMinutes !== 0) return
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

function drawCenterInfo(ctx, cx, cy, innerR, blocks, currentTimeMinutes, text, textSecondary, primary, surface) {
  if (!innerR || innerR < 20) return
  const centerR = innerR - 8

  ctx.beginPath()
  ctx.arc(cx, cy, centerR, 0, TAU)
  ctx.fillStyle = surface
  ctx.fill()

  const now = currentTimeMinutes || 0
  const runningBlocks = findRunningBlocks(blocks, now)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (runningBlocks.length === 0) {
    ctx.fillStyle = text
    ctx.font = 'bold 22px Inter, sans-serif'
    ctx.fillText(minutesToStr(now), cx, cy - 10)

    ctx.fillStyle = textSecondary
    ctx.font = '12px Inter, sans-serif'
    ctx.fillText('No active task', cx, cy + 18)
  } else if (runningBlocks.length === 1) {
    const block = runningBlocks[0]
    const elapsed = now >= block.start ? now - block.start : 1440 - block.start + now
    const totalDuration = block.end <= block.start ? block.end + 1440 - block.start : block.end - block.start
    const remaining = Math.max(0, totalDuration - elapsed)
    const pct = totalDuration > 0 ? Math.round((elapsed / totalDuration) * 100) : 0

    ctx.fillStyle = text
    ctx.font = 'bold 22px Inter, sans-serif'
    ctx.fillText(block.label, cx, cy - 20)

    ctx.fillStyle = primary
    ctx.font = 'bold 16px Inter, sans-serif'
    ctx.fillText(minutesToStr(now), cx, cy + 5)

    ctx.fillStyle = textSecondary
    ctx.font = '12px Inter, sans-serif'
    ctx.fillText(remaining + 'm left ' + pct + '%', cx, cy + 28)

    const barW = centerR * 1.2
    const barH = 4
    const barX = cx - barW / 2
    const barY = cy + 45

    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.fillRect(barX, barY, barW, barH)
    if (pct > 0) {
      ctx.fillStyle = primary
      ctx.fillRect(barX, barY, barW * (pct / 100), barH)
    }
  } else {
    const slotH = 20
    const startY = cy - (runningBlocks.length * slotH) / 2 + slotH / 2

    ctx.fillStyle = primary
    ctx.font = 'bold 14px Inter, sans-serif'
    ctx.fillText(minutesToStr(now), cx, cy - runningBlocks.length * slotH / 2 - 14)

    ctx.font = '10px Inter, sans-serif'
    ctx.fillStyle = textSecondary
    ctx.fillText(runningBlocks.length + ' tasks running', cx, cy - runningBlocks.length * slotH / 2 - 2)

    for (let i = 0; i < runningBlocks.length; i++) {
      const b = runningBlocks[i]
      const y = startY + i * slotH

      const elapsed = now >= b.start ? now - b.start : 1440 - b.start + now
      const total = b.end <= b.start ? b.end + 1440 - b.start : b.end - b.start
      const remaining = Math.max(0, total - elapsed)

      ctx.fillStyle = b.color || '#3B82F6'
      ctx.beginPath()
      ctx.arc(cx - centerR + 16, y, 4, 0, TAU)
      ctx.fill()

      const label = b.label.length > 10 ? b.label.slice(0, 9) + '…' : b.label
      ctx.fillStyle = text
      ctx.font = '11px Inter, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(label, cx - centerR + 26, y + 1)

      ctx.textAlign = 'right'
      ctx.fillStyle = textSecondary
      ctx.fillText(remaining + 'm', cx + centerR - 10, y + 1)
      ctx.textAlign = 'center'
    }
  }
}

function drawPlacement(ctx, cx, cy, innerR, arcWidth, placement, placementStart, placementPos, zoomRange) {
  const outerR = innerR + arcWidth
  const pColor = CATEGORY_COLORS[placement.category] || CATEGORY_COLORS.work

  if (placementStart != null) {
    const rmStart = toRenderMinute(placementStart, zoomRange)
    const rmEnd = toRenderMinute(placementPos, zoomRange)
    const startAngle = renderMinuteToRadians(rmStart)
    const endAngle = renderMinuteToRadians(rmEnd)
    const adjEndAngle = rmEnd <= rmStart ? endAngle + 2 * PI : endAngle

    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, outerR, startAngle, endAngle)
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true)
    ctx.closePath()
    ctx.fillStyle = pColor
    ctx.globalAlpha = 0.4
    ctx.fill()
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = pColor
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.8
    ctx.stroke()

    if (rmStart !== rmEnd) {
      const midAngle = (startAngle + adjEndAngle) / 2
      const midR = innerR + arcWidth / 2
      const mx = cx + Math.cos(midAngle) * midR
      const my = cy + Math.sin(midAngle) * midR
      ctx.setLineDash([])
      ctx.translate(mx, my)
      let rot = midAngle + PI / 2
      while (rot > PI / 2) rot -= PI
      while (rot < -PI / 2) rot += PI
      ctx.rotate(rot)
      ctx.fillStyle = pColor
      ctx.font = 'bold 11px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const duration = Math.round(rmEnd > rmStart ? rmEnd - rmStart : rmEnd + 1440 - rmStart)
      const h = Math.floor(duration / 60)
      const m = duration % 60
      ctx.fillText(h > 0 ? h + 'h ' + m + 'm' : m + 'm', 0, 0)
      ctx.restore()
    } else {
      ctx.restore()
    }
  } else {
    const rm = toRenderMinute(placementPos, zoomRange)
    const angle = renderMinuteToRadians(rm)

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR)
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR)
    ctx.strokeStyle = pColor
    ctx.lineWidth = 2
    ctx.setLineDash([3, 4])
    ctx.globalAlpha = 0.7
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR, 4, 0, TAU)
    ctx.fillStyle = pColor
    ctx.globalAlpha = 0.9
    ctx.fill()
    ctx.restore()
  }
}

function findRunningBlocks(blocks, now) {
  const result = []
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (block.end > block.start) {
      if (now >= block.start && now < block.end) result.push(block)
    } else {
      if (now >= block.start || now < block.end) result.push(block)
    }
  }
  return result
}
