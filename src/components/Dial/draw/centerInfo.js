import { MINUTES_IN_DAY, CATEGORY_COLORS } from '../../../store/constants'
import { minutesToStr } from '../../../utils'
import { TAU } from './utils'
import { findRunningBlocks } from './blocks'

function formatTimerTime(totalSeconds) {
  const s = Math.ceil(totalSeconds)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function getPhaseLabel(phase) {
  switch (phase) {
    case 'work': return 'Focus'
    case 'shortBreak': return 'Short Break'
    case 'longBreak': return 'Long Break'
    default: return 'Timer'
  }
}

function drawTimerCenter(ctx, cx, cy, centerR, timerState, text, textSecondary) {
  const { remaining, progress, phase, mode, pomodoroCount } = timerState

  const phaseColors = {
    work: '#6366F1',
    shortBreak: '#4ADE80',
    longBreak: '#A78BFA',
  }
  const phaseColor = phaseColors[phase] || '#6366F1'

  const ringR = centerR - 12
  const strokeWidth = 4

  ctx.beginPath()
  ctx.arc(cx, cy, ringR, 0, TAU)
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'
  ctx.lineWidth = strokeWidth
  ctx.stroke()

  if (progress > 0) {
    const startAngle = -Math.PI / 2
    const endAngle = startAngle + TAU * Math.min(progress, 1)
    ctx.beginPath()
    ctx.arc(cx, cy, ringR, startAngle, endAngle)
    ctx.strokeStyle = phaseColor
    ctx.lineWidth = strokeWidth
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.lineCap = 'butt'
  }

  const dotAngle = -Math.PI / 2 + TAU * Math.min(progress, 1)
  const dotX = cx + Math.cos(dotAngle) * ringR
  const dotY = cy + Math.sin(dotAngle) * ringR
  ctx.beginPath()
  ctx.arc(dotX, dotY, 3, 0, TAU)
  ctx.fillStyle = phaseColor
  ctx.fill()

  ctx.fillStyle = text
  ctx.font = 'bold 28px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(formatTimerTime(remaining), cx, cy - 6)

  ctx.fillStyle = phaseColor
  ctx.font = 'bold 10px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const phaseLabel = getPhaseLabel(phase)
  const pomodoroLabel = mode === 'pomodoro' ? ` #${pomodoroCount + 1}` : ''
  ctx.fillText(phaseLabel + pomodoroLabel, cx, cy + 16)

  ctx.fillStyle = textSecondary
  ctx.font = '10px Inter, sans-serif'
  ctx.fillText(Math.round(progress * 100) + '%', cx, cy + 30)
}

export function drawCenterInfo(ctx, cx, cy, innerR, blocks, currentTimeMinutes, text, textSecondary, primary, surface, timerState) {
  if (!innerR || innerR < 20) return
  const centerR = innerR - 8
  const isSmall = innerR < 30

  ctx.beginPath()
  ctx.arc(cx, cy, centerR, 0, TAU)
  ctx.fillStyle = surface
  ctx.fill()

  if (timerState && timerState.running && timerState.remaining > 0) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, centerR, 0, TAU)
    ctx.clip()
    drawTimerCenter(ctx, cx, cy, centerR, timerState, text, textSecondary)
    ctx.restore()
    return
  }

  const now = currentTimeMinutes || 0
  const runningBlocks = findRunningBlocks(blocks, now)

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, centerR, 0, TAU)
  ctx.clip()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (runningBlocks.length === 0) {
    const timeFontSize = isSmall ? 14 : 22
    const subFontSize = isSmall ? 9 : 12
    ctx.fillStyle = text
    ctx.font = `bold ${timeFontSize}px Inter, sans-serif`
    ctx.fillText(minutesToStr(now), cx, cy - (isSmall ? 6 : 10))

    ctx.fillStyle = textSecondary
    ctx.font = `${subFontSize}px Inter, sans-serif`
    ctx.fillText('No active task', cx, cy + (isSmall ? 10 : 18))
  } else if (runningBlocks.length === 1) {
    const block = runningBlocks[0]
    const elapsed = now >= block.start ? now - block.start : MINUTES_IN_DAY - block.start + now
    const totalDuration = block.end <= block.start ? block.end + MINUTES_IN_DAY - block.start : block.end - block.start
    const remaining = Math.max(0, totalDuration - elapsed)
    const pct = totalDuration > 0 ? Math.round((elapsed / totalDuration) * 100) : 0

    const maxLabelLen = 14
    const label = block.label.length > maxLabelLen ? block.label.slice(0, maxLabelLen - 1) + '\u2026' : block.label
    let labelFontSize
    if (isSmall) {
      labelFontSize = block.label.length > 10 ? 11 : 13
    } else {
      labelFontSize = block.label.length > 10 ? 16 : 20
    }
    const labelFont = `bold ${labelFontSize}px Inter, sans-serif`

    ctx.fillStyle = text
    ctx.font = labelFont
    ctx.fillText(label, cx, cy - (isSmall ? 14 : 20))

    ctx.fillStyle = primary
    ctx.font = `bold ${isSmall ? 11 : 14}px Inter, sans-serif`
    ctx.fillText(minutesToStr(now), cx, cy + (isSmall ? 2 : 4))

    ctx.fillStyle = textSecondary
    ctx.font = `${isSmall ? 9 : 11}px Inter, sans-serif`
    ctx.fillText(remaining + 'm left ' + pct + '%', cx, cy + (isSmall ? 16 : 22))

    const barW = Math.min(centerR * 1.2, centerR * 2 - 16)
    const barH = isSmall ? 3 : 4
    const barX = cx - barW / 2
    const barY = cy + (isSmall ? 26 : 36)

    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.fillRect(barX, barY, barW, barH)
    if (pct > 0) {
      ctx.fillStyle = primary
      ctx.fillRect(barX, barY, barW * (pct / 100), barH)
    }
  } else {
    const padding = isSmall ? 20 : 40
    const headerH = isSmall ? 20 : 28
    const moreIndicatorH = isSmall ? 12 : 14
    const availH = centerR * 2 - padding - headerH

    const minSlotH = isSmall ? 18 : 22
    const maxSlotH = isSmall ? 22 : 28
    const slotH = Math.max(minSlotH, Math.min(maxSlotH, Math.floor(availH / runningBlocks.length)))

    const maxVisible = Math.max(1, Math.floor((availH - moreIndicatorH) / slotH))
    const visibleCount = Math.min(runningBlocks.length, maxVisible)
    const truncated = runningBlocks.length > visibleCount
    const listH = visibleCount * slotH
    const startY = cy - listH / 2 + slotH / 2

    const timeFontSize = isSmall ? 11 : 14
    const countFontSize = isSmall ? 8 : 10
    ctx.fillStyle = primary
    ctx.font = `bold ${timeFontSize}px Inter, sans-serif`
    ctx.fillText(minutesToStr(now), cx, startY - slotH / 2 - (isSmall ? 6 : 10))

    ctx.font = `${countFontSize}px Inter, sans-serif`
    ctx.fillStyle = textSecondary
    ctx.fillText(runningBlocks.length + ' tasks running', cx, startY - slotH / 2 - (isSmall ? 1 : 1))

    const labelFontSize = isSmall ? 10 : 12
    const labelMaxLen = Math.max(6, Math.floor((centerR * 2 - 60) / (labelFontSize * 0.6)))

    for (let i = 0; i < visibleCount; i++) {
      const b = runningBlocks[i]
      const y = startY + i * slotH

      const elapsed = now >= b.start ? now - b.start : MINUTES_IN_DAY - b.start + now
      const total = b.end <= b.start ? b.end + MINUTES_IN_DAY - b.start : b.end - b.start
      const remaining = Math.max(0, total - elapsed)

      const dotR = isSmall ? 3 : 4
      ctx.fillStyle = b.color || CATEGORY_COLORS.work
      ctx.beginPath()
      ctx.arc(cx - centerR + (isSmall ? 12 : 16), y, dotR, 0, TAU)
      ctx.fill()

      const label = b.label.length > labelMaxLen ? b.label.slice(0, labelMaxLen - 1) + '\u2026' : b.label
      ctx.fillStyle = text
      ctx.font = `${labelFontSize}px Inter, sans-serif`
      ctx.textAlign = 'left'
      ctx.fillText(label, cx - centerR + (isSmall ? 18 : 26), y + 1)

      ctx.textAlign = 'right'
      ctx.fillStyle = textSecondary
      ctx.font = `${labelFontSize}px Inter, sans-serif`
      ctx.fillText(remaining + 'm', cx + centerR - (isSmall ? 6 : 10), y + 1)
      ctx.textAlign = 'center'
    }

    if (truncated) {
      const remainder = runningBlocks.length - visibleCount
      ctx.fillStyle = textSecondary
      ctx.font = `${isSmall ? 8 : 10}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('+' + remainder + ' more', cx, startY + visibleCount * slotH + (isSmall ? 2 : 4))
    }
  }

  ctx.restore()
}
