import { MINUTES_IN_DAY, CATEGORY_COLORS } from '../../../store/constants'
import { minutesToStr } from '../../../utils'
import { TAU } from './utils'
import { findRunningBlocks } from './blocks'

export function drawCenterInfo(ctx, cx, cy, innerR, blocks, currentTimeMinutes, text, textSecondary, primary, surface) {
  if (!innerR || innerR < 20) return
  const centerR = innerR - 8

  ctx.beginPath()
  ctx.arc(cx, cy, centerR, 0, TAU)
  ctx.fillStyle = surface
  ctx.fill()

  const now = currentTimeMinutes || 0
  const runningBlocks = findRunningBlocks(blocks, now)

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, centerR, 0, TAU)
  ctx.clip()

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
    const elapsed = now >= block.start ? now - block.start : MINUTES_IN_DAY - block.start + now
    const totalDuration = block.end <= block.start ? block.end + MINUTES_IN_DAY - block.start : block.end - block.start
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
    const availH = centerR * 2 - 40
    const slotH = Math.max(24, Math.min(28, Math.floor(availH / runningBlocks.length)))
    const visibleCount = Math.min(runningBlocks.length, Math.max(1, Math.floor(availH / slotH)))
    const truncated = runningBlocks.length > visibleCount
    const listH = visibleCount * slotH
    const startY = cy - listH / 2 + slotH / 2

    ctx.fillStyle = primary
    ctx.font = 'bold 14px Inter, sans-serif'
    ctx.fillText(minutesToStr(now), cx, cy - listH / 2 - 14)

    ctx.font = '10px Inter, sans-serif'
    ctx.fillStyle = textSecondary
    ctx.fillText(runningBlocks.length + ' tasks running', cx, cy - listH / 2 - 2)

    const labelMaxLen = 12
    const labelFontSize = 12

    for (let i = 0; i < visibleCount; i++) {
      const b = runningBlocks[i]
      const y = startY + i * slotH

      const elapsed = now >= b.start ? now - b.start : MINUTES_IN_DAY - b.start + now
      const total = b.end <= b.start ? b.end + MINUTES_IN_DAY - b.start : b.end - b.start
      const remaining = Math.max(0, total - elapsed)

      ctx.fillStyle = b.color || CATEGORY_COLORS.work
      ctx.beginPath()
      ctx.arc(cx - centerR + 16, y, 4, 0, TAU)
      ctx.fill()

      const label = b.label.length > labelMaxLen ? b.label.slice(0, labelMaxLen - 1) + '\u2026' : b.label
      ctx.fillStyle = text
      ctx.font = labelFontSize + 'px Inter, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(label, cx - centerR + 26, y + 1)

      ctx.textAlign = 'right'
      ctx.fillStyle = textSecondary
      ctx.font = labelFontSize + 'px Inter, sans-serif'
      ctx.fillText(remaining + 'm', cx + centerR - 10, y + 1)
      ctx.textAlign = 'center'
    }

    if (truncated) {
      const remainder = runningBlocks.length - visibleCount
      ctx.fillStyle = textSecondary
      ctx.font = '10px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('+' + remainder + ' more', cx, startY + visibleCount * slotH)
    }
  }

  ctx.restore()
}
