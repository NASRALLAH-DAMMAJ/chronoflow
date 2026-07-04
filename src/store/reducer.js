import { SNAP_MINUTES } from './constants'
import { formatDate } from '../utils'

function snapToGrid(minutes) {
  const snap = SNAP_MINUTES
  return Math.round(minutes / snap) * snap
}

export function createBlock({ id, start, end, label, category = 'other', tags = [], energy }) {
  return { id, start, end, label, category, tags, energy, createdAt: Date.now() }
}

export function blockReducer(state, action) {
  switch (action.type) {
    case 'ADD_BLOCK': {
      const block = createBlock(action.payload)
      return { ...state, blocks: [...state.blocks, block] }
    }
    case 'UPDATE_BLOCK': {
      const blocks = state.blocks.map(b =>
        b.id === action.payload.id ? { ...b, ...action.payload } : b
      )
      return { ...state, blocks }
    }
    case 'DELETE_BLOCK': {
      const blocks = state.blocks.filter(b => b.id !== action.payload.id)
      return { ...state, blocks }
    }
    case 'MOVE_BLOCK': {
      const { id, newStart } = action.payload
      const block = state.blocks.find(b => b.id === id)
      if (!block) return state
      const wraps = block.end <= block.start
      const duration = wraps ? (block.end + 1440 - block.start) : (block.end - block.start)
      const snappedStart = snapToGrid(newStart)
      const newEnd = snapToGrid(snappedStart + duration)
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.id === id
            ? { ...b, start: snappedStart % 1440, end: newEnd % 1440 || 1440 }
            : b
        ),
      }
    }
    case 'RESIZE_BLOCK': {
      const { id, newEnd } = action.payload
      const block = state.blocks.find(b => b.id === id)
      if (!block) return state
      const snappedEnd = snapToGrid(newEnd)
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.id === id
            ? { ...b, end: snappedEnd === b.start ? (b.start === 0 ? 1440 : b.start === 1440 ? 0 : b.end) : snappedEnd }
            : b
        ),
      }
    }
    case 'RESIZE_BLOCK_START': {
      const { id, newStart } = action.payload
      const block = state.blocks.find(b => b.id === id)
      if (!block) return state
      const snappedStart = snapToGrid(newStart)
      return {
        ...state,
        blocks: state.blocks.map(b =>
          b.id === id
            ? { ...b, start: snappedStart === b.end ? (b.end === 0 ? 1440 : b.end === 1440 ? 0 : b.start) : snappedStart }
            : b
        ),
      }
    }
    case 'SET_DATE': {
      return { ...state, dateStr: action.payload, loaded: false }
    }
    case 'LOAD_BLOCKS': {
      return { ...state, blocks: action.payload, loaded: true }
    }
    case 'SELECT_BLOCK': {
      return { ...state, selectedId: action.payload.id }
    }
    case 'COMPLETE_DAY': {
      const ds = action.payload
      if (state.completedDays.includes(ds)) return state
      const completedDays = [...state.completedDays, ds]
      return { ...state, completedDays }
    }
    case 'LOAD_COMPLETED': {
      return { ...state, completedDays: action.payload }
    }
    case 'SET_LOADING': {
      return { ...state, loading: action.payload }
    }
    default:
      return state
  }
}

export const initialState = {
  blocks: [],
  dateStr: '',
  loaded: false,
  selectedId: null,
  completedDays: [],
}

export function loadCompletedDays() {
  try {
    return JSON.parse(localStorage.getItem('cf-completed') || '[]')
  } catch {
    return []
  }
}

export function saveCompletedDays(days) {
  try {
    localStorage.setItem('cf-completed', JSON.stringify(days))
  } catch {}
}

export function computeStreak(completedDays) {
  let streak = 0
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  while (completedDays.includes(formatDate(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}
