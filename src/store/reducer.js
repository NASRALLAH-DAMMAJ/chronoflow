import { SNAP_MINUTES } from './constants'

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
      const duration = block.end - block.start
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
            ? { ...b, end: snappedEnd > b.start ? snappedEnd : b.end }
            : b
        ),
      }
    }
    case 'SET_DATE': {
      return { ...state, dateStr: action.payload }
    }
    case 'LOAD_BLOCKS': {
      return { ...state, blocks: action.payload, loaded: true }
    }
    case 'SELECT_BLOCK': {
      return { ...state, selectedId: action.payload.id }
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
}
