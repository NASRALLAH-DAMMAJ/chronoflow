const POMODORO_WORK = 25 * 60
const POMODORO_SHORT_BREAK = 5 * 60
const POMODORO_LONG_BREAK = 15 * 60
const POMODOROS_BEFORE_LONG_BREAK = 4

let state = {
  running: false,
  paused: false,
  mode: 'task',
  phase: 'work',
  duration: 0,
  remaining: 0,
  pomodoroCount: 0,
  blockId: null,
  rafId: null,
  lastTick: 0,
  onComplete: null,
  onTick: null,
}

function tick(now) {
  if (!state.running || state.paused) return
  if (!state.lastTick) state.lastTick = now

  const elapsed = (now - state.lastTick) / 1000
  state.lastTick = now
  state.remaining = Math.max(0, state.remaining - elapsed)

  if (state.onTick) {
    state.onTick(getTimerState())
  }

  if (state.remaining <= 0) {
    const callback = state.onComplete
    const completedPhase = state.phase
    const completedBlockId = state.blockId
    state.running = false
    state.paused = false
    state.rafId = null

    if (state.mode === 'pomodoro') {
      if (completedPhase === 'work') {
        state.pomodoroCount++
        if (state.pomodoroCount % POMODOROS_BEFORE_LONG_BREAK === 0) {
          state.phase = 'longBreak'
          state.duration = POMODORO_LONG_BREAK
        } else {
          state.phase = 'shortBreak'
          state.duration = POMODORO_SHORT_BREAK
        }
        state.remaining = state.duration
        state.running = true
        state.paused = false
        state.lastTick = 0
        if (callback) callback({ phase: completedPhase, blockId: completedBlockId, autoStarted: state.phase })
      } else {
        state.phase = 'work'
        state.duration = POMODORO_WORK
        state.remaining = state.duration
        state.running = true
        state.paused = false
        state.lastTick = 0
        if (callback) callback({ phase: completedPhase, blockId: completedBlockId, autoStarted: 'work' })
      }
    } else {
      if (callback) callback({ phase: completedPhase, blockId: completedBlockId, autoStarted: null })
    }
    return
  }

  state.rafId = requestAnimationFrame(tick)
}

function stopTimer() {
  if (state.rafId) {
    cancelAnimationFrame(state.rafId)
    state.rafId = null
  }
}

export function startTaskTimer(durationMinutes, blockId, { onTick, onComplete } = {}) {
  stopTimer()
  const duration = durationMinutes * 60
  state = {
    ...state,
    running: true,
    paused: false,
    mode: 'task',
    phase: 'work',
    duration,
    remaining: duration,
    blockId,
    pomodoroCount: 0,
    rafId: null,
    lastTick: 0,
    onTick,
    onComplete,
  }
  state.rafId = requestAnimationFrame(tick)
  return getTimerState()
}

export function startPomodoroTimer(blockId, { onTick, onComplete } = {}) {
  stopTimer()
  state = {
    ...state,
    running: true,
    paused: false,
    mode: 'pomodoro',
    phase: 'work',
    duration: POMODORO_WORK,
    remaining: POMODORO_WORK,
    blockId,
    pomodoroCount: 0,
    rafId: null,
    lastTick: 0,
    onTick,
    onComplete,
  }
  state.rafId = requestAnimationFrame(tick)
  return getTimerState()
}

export function pauseTimer() {
  if (!state.running || state.paused) return
  state.paused = true
  if (state.rafId) {
    cancelAnimationFrame(state.rafId)
    state.rafId = null
  }
  return getTimerState()
}

export function resumeTimer() {
  if (!state.running || !state.paused) return
  state.paused = false
  state.lastTick = 0
  state.rafId = requestAnimationFrame(tick)
  return getTimerState()
}

export function resetTimer() {
  if (state.rafId) {
    cancelAnimationFrame(state.rafId)
  }
  state = {
    running: false,
    paused: false,
    mode: 'task',
    phase: 'work',
    duration: 0,
    remaining: 0,
    pomodoroCount: 0,
    blockId: null,
    rafId: null,
    lastTick: 0,
    onComplete: null,
    onTick: null,
  }
  return getTimerState()
}

export function skipPhase() {
  if (!state.running) return
  const phase = state.phase
  if (state.rafId) {
    cancelAnimationFrame(state.rafId)
    state.rafId = null
  }
  state.remaining = 0

  if (state.mode === 'pomodoro') {
    if (phase === 'work') {
      state.pomodoroCount++
      if (state.pomodoroCount % POMODOROS_BEFORE_LONG_BREAK === 0) {
        state.phase = 'longBreak'
        state.duration = POMODORO_LONG_BREAK
      } else {
        state.phase = 'shortBreak'
        state.duration = POMODORO_SHORT_BREAK
      }
    } else {
      state.phase = 'work'
      state.duration = POMODORO_WORK
    }
  } else {
    state.phase = 'work'
  }

  state.remaining = state.duration
  state.running = true
  state.paused = false
  state.lastTick = 0
  state.rafId = requestAnimationFrame(tick)
  return getTimerState()
}

export function getTimerState() {
  return {
    running: state.running,
    paused: state.paused,
    mode: state.mode,
    phase: state.phase,
    duration: state.duration,
    remaining: state.remaining,
    pomodoroCount: state.pomodoroCount,
    blockId: state.blockId,
    progress: state.duration > 0 ? 1 - (state.remaining / state.duration) : 0,
  }
}

export function formatTime(totalSeconds) {
  const s = Math.ceil(totalSeconds)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function getPhaseLabel(phase) {
  switch (phase) {
    case 'work': return 'Focus'
    case 'shortBreak': return 'Short Break'
    case 'longBreak': return 'Long Break'
    default: return 'Timer'
  }
}
