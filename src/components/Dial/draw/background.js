import { TAU } from './utils'

export function drawBackground(ctx, cx, cy, outerR, innerR, bg, border, surface) {
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
