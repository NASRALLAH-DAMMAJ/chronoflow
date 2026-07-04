import { MINUTES_IN_DAY, CATEGORY_COLORS } from '../../../store/constants'
import { toRenderMinute } from '../zoom-utils'
import { renderMinuteToRadians, PI, TAU } from './utils'

export function drawPlacement(ctx, cx, cy, innerR, arcWidth, placement, placementStart, placementPos, zoomRange) {
  const outerR = innerR + arcWidth
  const pColor = CATEGORY_COLORS[placement.category] || CATEGORY_COLORS.work

  if (placementStart != null) {
    const rmStart = toRenderMinute(placementStart, zoomRange)
    const rmEnd = toRenderMinute(placementPos, zoomRange)
    const startAngle = renderMinuteToRadians(rmStart)
    const endAngle = renderMinuteToRadians(rmEnd)
    const adjEndAngle = rmEnd <= rmStart ? endAngle + TAU : endAngle

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
      const duration = Math.round(rmEnd > rmStart ? rmEnd - rmStart : rmEnd + MINUTES_IN_DAY - rmStart)
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
