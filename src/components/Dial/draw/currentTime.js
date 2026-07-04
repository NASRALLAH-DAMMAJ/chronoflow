import { toRenderMinute } from '../zoom-utils'
import { renderMinuteToRadians, TAU } from './utils'

export function drawCurrentTime(ctx, cx, cy, innerR, arcWidth, currentTimeMinutes, color, zoomRange) {
  if (!currentTimeMinutes && currentTimeMinutes !== 0) return
  const angle = renderMinuteToRadians(toRenderMinute(currentTimeMinutes, zoomRange))
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
