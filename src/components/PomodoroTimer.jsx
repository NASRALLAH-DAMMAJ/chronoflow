import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  startTaskTimer,
  startPomodoroTimer,
  pauseTimer,
  resumeTimer,
  resetTimer,
  getTimerState,
  formatTime,
  getPhaseLabel,
} from '../lib/pomodoro'

const TIMER_SIZE = 200
const STROKE_WIDTH = 6
const RADIUS = (TIMER_SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function PomodoroTimer({ blockId, blockLabel, blockDuration, onStateChange }) {
  const [timer, setTimer] = useState(() => getTimerState())
  const [mode, setMode] = useState('task')

  useEffect(() => {
    const handler = () => setTimer(getTimerState())
    window.addEventListener('pomodoro-tick', handler)
    return () => window.removeEventListener('pomodoro-tick', handler)
  }, [])

  useEffect(() => {
    const handleStartEvent = (e) => {
      const { block, duration } = e.detail || {}
      if (block) {
        const onTick = (state) => {
          window.dispatchEvent(new CustomEvent('pomodoro-tick', { detail: state }))
        }
        const onComplete = (result) => {
          if (navigator.vibrate) navigator.vibrate([200, 100, 200])
          window.dispatchEvent(new CustomEvent('pomodoro-complete', { detail: result }))
          setTimer(getTimerState())
        }
        startTaskTimer(duration, block.id, { onTick, onComplete })
        setTimer(getTimerState())
      }
    }
    window.addEventListener('pomodoro-start', handleStartEvent)
    return () => window.removeEventListener('pomodoro-start', handleStartEvent)
  }, [])

  useEffect(() => {
    if (onStateChange) onStateChange(timer)
  }, [timer, onStateChange])

  useEffect(() => {
    if (timer.running) {
      document.title = `${formatTime(timer.remaining)} - ${getPhaseLabel(timer.phase)} | ChronoFlow`
    }
    return () => { document.title = 'ChronoFlow' }
  }, [timer.running, timer.remaining, timer.phase])

  const handleStart = useCallback(() => {
    const onTick = (state) => {
      window.dispatchEvent(new CustomEvent('pomodoro-tick', { detail: state }))
    }
    const onComplete = (result) => {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
      window.dispatchEvent(new CustomEvent('pomodoro-complete', { detail: result }))
      setTimer(getTimerState())
    }

    if (mode === 'task' && blockDuration) {
      startTaskTimer(blockDuration, blockId, { onTick, onComplete })
    } else {
      startPomodoroTimer(blockId, { onTick, onComplete })
    }
    setTimer(getTimerState())
  }, [mode, blockId, blockDuration])

  const handlePause = useCallback(() => {
    pauseTimer()
    setTimer(getTimerState())
  }, [])

  const handleResume = useCallback(() => {
    resumeTimer()
    setTimer(getTimerState())
  }, [])

  const handleReset = useCallback(() => {
    resetTimer()
    setTimer(getTimerState())
  }, [])

  const dashOffset = CIRCUMFERENCE * (1 - timer.progress)

  const phaseColor = useMemo(() => {
    switch (timer.phase) {
      case 'work': return 'var(--clr-primary)'
      case 'shortBreak': return '#4ADE80'
      case 'longBreak': return '#A78BFA'
      default: return 'var(--clr-primary)'
    }
  }, [timer.phase])

  if (!timer.running) {
    return (
      <div style={containerStyle}>
        <div style={modeToggleStyle}>
          <button
            onClick={() => setMode('task')}
            style={{ ...modeBtnStyle, ...(mode === 'task' ? activeModeBtnStyle : {}) }}
            disabled={!blockDuration}
            title={!blockDuration ? 'Select a task to use Task Mode' : 'Timer counts from task duration'}
          >
            Task
          </button>
          <button
            onClick={() => setMode('pomodoro')}
            style={{ ...modeBtnStyle, ...(mode === 'pomodoro' ? activeModeBtnStyle : {}) }}
          >
            Pomodoro
          </button>
        </div>
        {blockLabel && (
          <div style={labelStyle}>{blockLabel}</div>
        )}
        <svg width={TIMER_SIZE} height={TIMER_SIZE} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={TIMER_SIZE / 2}
            cy={TIMER_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--clr-border)"
            strokeWidth={STROKE_WIDTH}
          />
        </svg>
        <div style={centerOverlayStyle}>
          <span style={timeTextStyle}>{mode === 'task' && blockDuration ? formatTime(blockDuration * 60) : formatTime(POMODORO_WORK)}</span>
          <span style={subTextStyle}>{mode === 'task' ? 'task duration' : '25 min focus'}</span>
        </div>
        <button
          onClick={handleStart}
          style={startBtnStyle}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Start
        </button>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={phaseLabelStyle(phaseColor)}>
        {getPhaseLabel(timer.phase)}
        {timer.mode === 'pomodoro' && (
          <span style={pomodoroCountStyle}>
            #{timer.pomodoroCount + 1}
          </span>
        )}
      </div>
      {blockLabel && timer.running && (
        <div style={{ ...labelStyle, marginBottom: 4 }}>{blockLabel}</div>
      )}
      <div style={timerRingContainer}>
        <svg width={TIMER_SIZE} height={TIMER_SIZE} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={TIMER_SIZE / 2}
            cy={TIMER_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--clr-border)"
            strokeWidth={STROKE_WIDTH}
          />
          <circle
            cx={TIMER_SIZE / 2}
            cy={TIMER_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={phaseColor}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.3s linear' }}
          />
        </svg>
        <div style={centerOverlayStyle}>
          <span style={timeTextStyle}>{formatTime(timer.remaining)}</span>
          <span style={subTextStyle}>{Math.round(timer.progress * 100)}%</span>
        </div>
      </div>
      <div style={controlsStyle}>
        {timer.paused ? (
          <button onClick={handleResume} style={controlBtnStyle} title="Resume">▶</button>
        ) : (
          <button onClick={handlePause} style={controlBtnStyle} title="Pause">⏸</button>
        )}
        <button onClick={handleReset} style={{ ...controlBtnStyle, color: '#EF4444' }} title="Reset">■</button>
      </div>
    </div>
  )
}

const POMODORO_WORK = 25 * 60

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  padding: '12px 0',
}

const timerRingContainer = {
  position: 'relative',
  width: TIMER_SIZE,
  height: TIMER_SIZE,
}

const centerOverlayStyle = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}

const timeTextStyle = {
  fontSize: 32,
  fontWeight: 700,
  fontFamily: 'var(--ff-mono, monospace)',
  color: 'var(--clr-text)',
  lineHeight: 1,
}

const subTextStyle = {
  fontSize: 11,
  color: 'var(--clr-text-secondary)',
  marginTop: 2,
}

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--clr-text)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 180,
}

const modeToggleStyle = {
  display: 'flex',
  gap: 2,
  backgroundColor: 'var(--clr-bg-secondary)',
  borderRadius: 8,
  padding: 2,
}

const modeBtnStyle = {
  padding: '4px 12px',
  border: 'none',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  backgroundColor: 'transparent',
  color: 'var(--clr-text-secondary)',
  transition: 'all 0.15s ease',
}

const activeModeBtnStyle = {
  backgroundColor: 'var(--clr-surface)',
  color: 'var(--clr-text)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
}

const startBtnStyle = {
  padding: '8px 24px',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  backgroundColor: 'var(--clr-primary)',
  color: '#fff',
  transition: 'transform 0.15s ease',
  marginTop: 4,
}

const controlsStyle = {
  display: 'flex',
  gap: 8,
}

const controlBtnStyle = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: '1px solid var(--clr-border)',
  backgroundColor: 'var(--clr-surface)',
  color: 'var(--clr-text)',
  fontSize: 14,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
}

const phaseLabelStyle = (color) => ({
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
})

const pomodoroCountStyle = {
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--clr-text-tertiary)',
}
