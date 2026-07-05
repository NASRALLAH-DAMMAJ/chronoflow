import { MINUTES_IN_DAY, CATEGORY_COLORS } from '../../../store/constants'
import { toRenderMinute, isVisible } from '../zoom-utils'
import { renderMinuteToRadians, PI, TAU } from './utils'

export function drawBlocks(ctx, cx, cy, innerR, arcWidth, blocks, selectedId, zoomRange) {
  for (const block of blocks) {
    if (zoomRange) {
      const wraps = block.end <= block.start
      const visible = wraps
        ? (block.start < zoomRange.end || block.end > zoomRange.start)
        : isVisible(block.start, zoomRange) || isVisible(block.end, zoomRange)
      if (!visible) continue
    }

    const renderStart = toRenderMinute(block.start, zoomRange)
    const renderEnd = toRenderMinute(block.end, zoomRange)
    let startAngle = renderMinuteToRadians(renderStart)
    let endAngle = renderMinuteToRadians(renderEnd)

    if (renderEnd <= renderStart) endAngle += TAU

    const isSelected = block.id === selectedId
    const outerR = innerR + arcWidth

    ctx.beginPath()
    ctx.arc(cx, cy, outerR, startAngle, endAngle)
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true)
    ctx.closePath()

    ctx.fillStyle = block.color || CATEGORY_COLORS.work
    ctx.globalAlpha = isSelected ? 0.85 : (block.locked ? 0.5 : 0.6)
    ctx.fill()
    ctx.globalAlpha = 1

    ctx.strokeStyle = isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.3)'
    ctx.lineWidth = isSelected ? 2 : 1
    if (block.is_recurring) ctx.setLineDash([3, 3])
    ctx.stroke()
    if (block.is_recurring) ctx.setLineDash([])

    const duration = block.end <= block.start ? block.end + MINUTES_IN_DAY - block.start : block.end - block.start
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
      const lockIcon = block.locked ? ' 🔒' : ''
      ctx.fillText(displayLabel + lockIcon + (block.is_recurring ? ' ↻' : ''), 0, 0)
      ctx.restore()
    }
  }
}

export function findRunningBlocks(blocks, now) {
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
