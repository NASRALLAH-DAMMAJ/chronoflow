import { MINUTES_IN_DAY, LS_KEYS, DEFAULT_CATEGORY } from './constants'
import { formatDate, snapToGrid } from '../utils'
import { computeOverlapMetadata } from '../lib/overlapDetector'

export function createBlock({ id, start, end, label, category = DEFAULT_CATEGORY, tags = [], energy, locked = false, updated_at = null }) {
  return { id, start, end, label, category, tags, energy, locked, createdAt: Date.now(), revision: 0, updated_at }
}

function incrementRevision(block) {
  return { ...block, revision: (block.revision || 0) + 1, updated_at: new Date().toISOString(), last_updated_at: performance.now() }
}

function updateBlocksAndComputeOverlaps(currentBlocks, newBlocks) {
  const updated = currentBlocks.map(b => {
    const newBlock = newBlocks.find(nb => nb.id === b.id)
    return newBlock ? newBlock : b
  })
  const added = newBlocks.filter(nb => !currentBlocks.some(cb => cb.id === nb.id))
  return computeOverlapMetadata([...updated, ...added])
}

function removeBlocksAndComputeOverlaps(currentBlocks, blockId) {
  const filtered = currentBlocks.filter(b => b.id !== blockId)
  return computeOverlapMetadata(filtered)
}

export function blockReducer(state, action) {
  let newBlocks = []
  switch (action.type) {
    case 'ADD_BLOCK': {
      const block = createBlock(action.payload)
      const exists = state.blocks.find(b => b.id === block.id)
      if (exists) {
        newBlocks = state.blocks.map(b => b.id === block.id ? { ...b, ...block, ...(b.revision !== undefined ? { revision: (b.revision || 0) + 1, updated_at: new Date().toISOString(), last_updated_at: performance.now() } : {}) } : b)
      } else {
        newBlocks = [...state.blocks, block]
      }
      return { ...state, blocks: computeOverlapMetadata(newBlocks) }
    }
    case 'UPDATE_BLOCK': {
      newBlocks = state.blocks.map(b =>
        b.id === action.payload.id ? incrementRevision({ ...b, ...action.payload }) : b
      )
      return { ...state, blocks: computeOverlapMetadata(newBlocks) }
    }
    case 'DELETE_BLOCK': {
      return { ...state, blocks: removeBlocksAndComputeOverlaps(state.blocks, action.payload.id) }
    }
    case 'MOVE_BLOCK': {
      const { id, newStart } = action.payload
      const block = state.blocks.find(b => b.id === id)
      if (!block) return state
      const wraps = block.end <= block.start
      const duration = wraps ? (block.end + MINUTES_IN_DAY - block.start) : (block.end - block.start)
      const snappedStart = snapToGrid(newStart)
      let newEnd = snapToGrid(snappedStart + duration)
      if (newEnd > MINUTES_IN_DAY) newEnd = newEnd - MINUTES_IN_DAY
      newBlocks = state.blocks.map(b =>
        b.id === id
          ? incrementRevision({ ...b, start: snappedStart % MINUTES_IN_DAY, end: newEnd % MINUTES_IN_DAY || MINUTES_IN_DAY })
          : b
      )
      return { ...state, blocks: computeOverlapMetadata(newBlocks) }
    }
    case 'RESIZE_BLOCK': {
      const { id, newEnd } = action.payload
      const block = state.blocks.find(b => b.id === id)
      if (!block) return state
      const snappedEnd = snapToGrid(newEnd)
      newBlocks = state.blocks.map(b =>
        b.id === id
          ? incrementRevision({ ...b, end: snappedEnd === b.start ? (b.start === 0 ? MINUTES_IN_DAY : b.start === MINUTES_IN_DAY ? 0 : b.end) : snappedEnd })
          : b
      )
      return { ...state, blocks: computeOverlapMetadata(newBlocks) }
    }
    case 'RESIZE_BLOCK_START': {
      const { id, newStart } = action.payload
      const block = state.blocks.find(b => b.id === id)
      if (!block) return state
      const snappedStart = snapToGrid(newStart)
      newBlocks = state.blocks.map(b =>
        b.id === id
          ? incrementRevision({ ...b, start: snappedStart === b.end ? (b.end === 0 ? MINUTES_IN_DAY : b.end === MINUTES_IN_DAY ? 0 : b.start) : snappedStart })
          : b
      )
      return { ...state, blocks: computeOverlapMetadata(newBlocks) }
    }
    case 'TOGGLE_LOCK': {
      newBlocks = state.blocks.map(b =>
        b.id === action.payload.id ? incrementRevision({ ...b, locked: !b.locked }) : b
      )
      return { ...state, blocks: computeOverlapMetadata(newBlocks) }
    }
    case 'SET_DATE': {
      return { ...state, dateStr: action.payload, loaded: false }
    }
    case 'LOAD_BLOCKS': {
      const blocks = (action.payload || []).map(b => {
        if (b.revision !== undefined) return b
        const existing = state.blocks.find(x => x.id === b.id)
        return { ...b, revision: existing?.revision || 0, last_updated_at: existing?.last_updated_at || undefined }
      })
      return { ...state, blocks: computeOverlapMetadata(blocks), loaded: true }
    }
    case 'SELECT_BLOCK': {
      return { ...state, selectedId: action.payload }
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
    case 'SET_CONFLICTS': {
      return { ...state, conflicts: action.payload }
    }
    case 'UPDATE_BLOCK_SILENT': {
      newBlocks = state.blocks.map(b =>
        b.id === action.payload.id ? { ...b, ...action.payload } : b
      )
      return { ...state, blocks: computeOverlapMetadata(newBlocks) }
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
  conflicts: [],
}

export function loadCompletedDays() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.COMPLETED) || '[]')
  } catch {
    return []
  }
}

export function saveCompletedDays(days) {
  try {
    localStorage.setItem(LS_KEYS.COMPLETED, JSON.stringify(days))
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
