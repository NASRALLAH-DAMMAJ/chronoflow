import { drawBackground } from './background'
import { drawHourTicks, drawHourLabels } from './ticks'
import { drawBlocks } from './blocks'
import { drawCurrentTime } from './currentTime'
import { drawCenterInfo } from './centerInfo'
import { drawPlacement } from './placement'

export function drawDial(ctx, cx, cy, radius, blocks, selectedId, currentTimeMinutes, colors, zoomRange, placement, placementPos, placementStart, labelInterval = 180, timeFormat = '24h', showHourLabels = true, timerState) {
  const { bg, border, text, textSecondary, primary, surface } = colors
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  const innerR = radius * 0.55
  const arcWidth = radius - innerR

  drawBackground(ctx, cx, cy, radius, innerR, bg, border, surface)
  drawHourTicks(ctx, cx, cy, radius, innerR, textSecondary, border, zoomRange, labelInterval)
  drawHourLabels(ctx, cx, cy, radius, text, zoomRange, labelInterval, timeFormat, showHourLabels)
  drawBlocks(ctx, cx, cy, innerR, arcWidth, blocks, selectedId, zoomRange)
  drawCurrentTime(ctx, cx, cy, innerR, arcWidth, currentTimeMinutes, primary, zoomRange)

  if (placement && placementPos != null) {
    drawPlacement(ctx, cx, cy, innerR, arcWidth, placement, placementStart, placementPos, zoomRange)
  }

  drawCenterInfo(ctx, cx, cy, innerR, blocks, currentTimeMinutes, text, textSecondary, primary, surface || bg, timerState)
}
