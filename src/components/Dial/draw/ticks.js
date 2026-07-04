import { MINUTES_IN_DAY } from '../../../store/constants'
import { toRenderMinute } from '../zoom-utils'
import { renderMinuteToRadians } from './utils'

export function drawHourTicks(ctx, cx, cy, outerR, innerR, color, borderColor, zoomRange) {
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

export function drawHourLabels(ctx, cx, cy, innerR, color, zoomRange) {
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
    const worldMin = (start + m) % MINUTES_IN_DAY
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
