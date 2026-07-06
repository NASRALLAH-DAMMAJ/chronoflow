import { MINUTES_IN_DAY } from '../../../store/constants'
import { toRenderMinute } from '../zoom-utils'
import { renderMinuteToRadians } from './utils'

function formatHour(hour, timeFormat) {
  if (timeFormat === '12h') {
    if (hour === 0 || hour === 24) return '12'
    if (hour <= 12) return String(hour)
    return String(hour - 12)
  }
  return hour === 0 || hour === 24 ? '24' : String(hour)
}

export function drawHourTicks(ctx, cx, cy, outerR, innerR, color, borderColor, zoomRange, majorInterval = 180) {
  if (!zoomRange) {
    for (let h = 0; h < 24; h++) {
      const angle = renderMinuteToRadians(h * 60)
      const isMajor = h % (majorInterval / 60) === 0
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
  const range = end > start ? end - start : MINUTES_IN_DAY - start + end
  const tickInterval = range > 480 ? 60 : range > 120 ? 30 : 15

  for (let m = 0; m <= range; m += tickInterval) {
    const worldMin = (start + m) % MINUTES_IN_DAY
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

export function drawHourLabels(ctx, cx, cy, outerR, color, zoomRange, labelInterval = 180, timeFormat = '24h') {
  if (!labelInterval) return

  ctx.fillStyle = color
  ctx.font = 'bold 12px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const labelR = outerR + 16

  if (!zoomRange) {
    for (let h = 0; h < 24; h += labelInterval / 60) {
      const angle = renderMinuteToRadians(h * 60)
      const x = cx + Math.cos(angle) * labelR
      const y = cy + Math.sin(angle) * labelR
      ctx.fillText(formatHour(h, timeFormat), x, y)
    }
    return
  }

  const { start, end } = zoomRange
  const range = end > start ? end - start : MINUTES_IN_DAY - start + end
  const autoInterval = range > 480 ? 120 : range > 240 ? 60 : range > 120 ? 30 : 15
  const interval = Math.min(autoInterval, labelInterval)

  for (let m = 0; m <= range; m += interval) {
    const worldMin = (start + m) % MINUTES_IN_DAY
    const rm = toRenderMinute(worldMin, zoomRange)
    const angle = renderMinuteToRadians(rm)
    const x = cx + Math.cos(angle) * labelR
    const y = cy + Math.sin(angle) * labelR
    const h = Math.floor(worldMin / 60)
    const min = worldMin % 60
    ctx.fillText(min === 0 ? formatHour(h, timeFormat) : `${formatHour(h, timeFormat)}:${String(min).padStart(2, '0')}`, x, y)
  }
}
