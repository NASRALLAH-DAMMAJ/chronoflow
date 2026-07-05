import { describe, it, expect } from 'vitest'
import { blockReducer, initialState, createBlock } from '../store/reducer'
import { BLOCK_CATEGORIES } from '../store/constants'

describe('initialState', () => {
  it('has expected shape', () => {
    expect(initialState).toEqual({
      blocks: [],
      dateStr: '',
      loaded: false,
      selectedId: null,
      completedDays: [],
    })
  })
})

describe('blockReducer', () => {
  it('returns state unchanged for unknown action', () => {
    const state = { ...initialState, blocks: [{ id: '1' }] }
    const result = blockReducer(state, { type: 'UNKNOWN', payload: {} })
    expect(result).toBe(state)
  })

  describe('ADD_BLOCK', () => {
    it('adds a block with createBlock fields', () => {
      const state = { ...initialState }
      const payload = { id: 'b1', start: 30, end: 90, label: 'Test', category: 'work', tags: ['dev'], energy: 3 }
      const result = blockReducer(state, { type: 'ADD_BLOCK', payload })
      expect(result.blocks).toHaveLength(1)
      const block = result.blocks[0]
      expect(block.id).toBe('b1')
      expect(block.start).toBe(30)
      expect(block.end).toBe(90)
      expect(block.label).toBe('Test')
      expect(block.category).toBe('work')
      expect(block.tags).toEqual(['dev'])
      expect(block.energy).toBe(3)
      expect(block).toHaveProperty('createdAt')
    })

    it('has default category other', () => {
      const state = { ...initialState }
      const payload = { id: 'b2', start: 0, end: 60, label: 'Default cat' }
      const result = blockReducer(state, { type: 'ADD_BLOCK', payload })
      expect(result.blocks[0].category).toBe('other')
    })
  })

  describe('UPDATE_BLOCK', () => {
    it('updates label and category', () => {
      const state = { ...initialState, blocks: [{ id: 'b1', start: 0, end: 60, label: 'Old', category: 'other', tags: [] }] }
      const result = blockReducer(state, { type: 'UPDATE_BLOCK', payload: { id: 'b1', label: 'New', category: 'work' } })
      expect(result.blocks[0].label).toBe('New')
      expect(result.blocks[0].category).toBe('work')
    })

    it('updates start and end', () => {
      const state = { ...initialState, blocks: [{ id: 'b1', start: 0, end: 60, label: 'X', category: 'other', tags: [] }] }
      const result = blockReducer(state, { type: 'UPDATE_BLOCK', payload: { id: 'b1', start: 120, end: 180 } })
      expect(result.blocks[0].start).toBe(120)
      expect(result.blocks[0].end).toBe(180)
    })

    it('does not affect other blocks', () => {
      const state = { ...initialState, blocks: [{ id: 'b1', start: 0, end: 60, label: 'A', category: 'other', tags: [] }, { id: 'b2', start: 60, end: 120, label: 'B', category: 'other', tags: [] }] }
      const result = blockReducer(state, { type: 'UPDATE_BLOCK', payload: { id: 'b1', label: 'Updated' } })
      expect(result.blocks[1].label).toBe('B')
    })
  })

  describe('DELETE_BLOCK', () => {
    it('removes block by id', () => {
      const state = { ...initialState, blocks: [{ id: 'b1', start: 0, end: 60, label: 'A', category: 'other', tags: [] }] }
      const result = blockReducer(state, { type: 'DELETE_BLOCK', payload: { id: 'b1' } })
      expect(result.blocks).toHaveLength(0)
    })

    it('handles missing id gracefully', () => {
      const state = { ...initialState, blocks: [{ id: 'b1', start: 0, end: 60, label: 'A', category: 'other', tags: [] }] }
      const result = blockReducer(state, { type: 'DELETE_BLOCK', payload: { id: 'nonexistent' } })
      expect(result.blocks).toHaveLength(1)
    })
  })

  describe('MOVE_BLOCK', () => {
    it('moves block to snapped position preserving duration', () => {
      const state = { ...initialState, blocks: [{ id: 'b1', start: 30, end: 90, label: 'A', category: 'other', tags: [] }] }
      const result = blockReducer(state, { type: 'MOVE_BLOCK', payload: { id: 'b1', newStart: 100 } })
      expect(result.blocks[0].start).toBe(100)
      expect(result.blocks[0].end).toBe(160)
    })

    it('handles block not found', () => {
      const state = { ...initialState, blocks: [{ id: 'b1', start: 0, end: 60, label: 'A', category: 'other', tags: [] }] }
      const result = blockReducer(state, { type: 'MOVE_BLOCK', payload: { id: 'missing', newStart: 100 } })
      expect(result).toBe(state)
    })

    it('handles wrapping blocks (end <= start)', () => {
      const state = { ...initialState, blocks: [{ id: 'b1', start: 1400, end: 30, label: 'Wrap', category: 'other', tags: [] }] }
      const result = blockReducer(state, { type: 'MOVE_BLOCK', payload: { id: 'b1', newStart: 100 } })
      const duration = 30 + 1440 - 1400
      const snappedStart = Math.round(100 / 5) * 5
      const snappedEnd = Math.round((snappedStart + duration) / 5) * 5
      expect(result.blocks[0].start).toBe(snappedStart % 1440)
      expect(result.blocks[0].end).toBe(snappedEnd % 1440 || 1440)
    })
  })

  describe('RESIZE_BLOCK', () => {
    it('snaps new end to grid', () => {
      const state = { ...initialState, blocks: [{ id: 'b1', start: 0, end: 60, label: 'A', category: 'other', tags: [] }] }
      const result = blockReducer(state, { type: 'RESIZE_BLOCK', payload: { id: 'b1', newEnd: 103 } })
      expect(result.blocks[0].end).toBe(105)
    })

    it('handles start == end edge case', () => {
      const state = { ...initialState, blocks: [{ id: 'b1', start: 30, end: 60, label: 'A', category: 'other', tags: [] }] }
      const result = blockReducer(state, { type: 'RESIZE_BLOCK', payload: { id: 'b1', newEnd: 30 } })
      expect(result.blocks[0].end).toBe(60)
    })

    it('handles block not found', () => {
      const state = { ...initialState, blocks: [{ id: 'b1', start: 0, end: 60, label: 'A', category: 'other', tags: [] }] }
      const result = blockReducer(state, { type: 'RESIZE_BLOCK', payload: { id: 'missing', newEnd: 100 } })
      expect(result).toBe(state)
    })
  })

  describe('RESIZE_BLOCK_START', () => {
    it('snaps new start to grid', () => {
      const state = { ...initialState, blocks: [{ id: 'b1', start: 0, end: 60, label: 'A', category: 'other', tags: [] }] }
      const result = blockReducer(state, { type: 'RESIZE_BLOCK_START', payload: { id: 'b1', newStart: 13 } })
      expect(result.blocks[0].start).toBe(15)
    })

    it('handles start == end edge case', () => {
      const state = { ...initialState, blocks: [{ id: 'b1', start: 30, end: 60, label: 'A', category: 'other', tags: [] }] }
      const result = blockReducer(state, { type: 'RESIZE_BLOCK_START', payload: { id: 'b1', newStart: 60 } })
      expect(result.blocks[0].start).toBe(30)
    })

    it('handles block not found', () => {
      const state = { ...initialState, blocks: [{ id: 'b1', start: 0, end: 60, label: 'A', category: 'other', tags: [] }] }
      const result = blockReducer(state, { type: 'RESIZE_BLOCK_START', payload: { id: 'missing', newStart: 100 } })
      expect(result).toBe(state)
    })
  })

  describe('SET_DATE', () => {
    it('changes dateStr and resets loaded to false', () => {
      const state = { ...initialState, dateStr: '2026-01-01', loaded: true }
      const result = blockReducer(state, { type: 'SET_DATE', payload: '2026-06-15' })
      expect(result.dateStr).toBe('2026-06-15')
      expect(result.loaded).toBe(false)
    })
  })

  describe('LOAD_BLOCKS', () => {
    it('sets blocks array and loaded to true', () => {
      const state = { ...initialState, loaded: false }
      const blocks = [{ id: 'b1', start: 0, end: 60, label: 'A', category: 'other', tags: [] }]
      const result = blockReducer(state, { type: 'LOAD_BLOCKS', payload: blocks })
      expect(result.blocks).toEqual(blocks)
      expect(result.loaded).toBe(true)
    })
  })

  describe('SELECT_BLOCK', () => {
    it('sets selectedId', () => {
      const state = { ...initialState, selectedId: null }
      const result = blockReducer(state, { type: 'SELECT_BLOCK', payload: 'b1' })
      expect(result.selectedId).toBe('b1')
    })
  })

  describe('COMPLETE_DAY', () => {
    it('adds date to completedDays', () => {
      const state = { ...initialState, completedDays: [] }
      const result = blockReducer(state, { type: 'COMPLETE_DAY', payload: '2026-07-04' })
      expect(result.completedDays).toEqual(['2026-07-04'])
    })

    it('ignores duplicate date', () => {
      const state = { ...initialState, completedDays: ['2026-07-04'] }
      const result = blockReducer(state, { type: 'COMPLETE_DAY', payload: '2026-07-04' })
      expect(result.completedDays).toEqual(['2026-07-04'])
    })
  })

  describe('LOAD_COMPLETED', () => {
    it('replaces completedDays', () => {
      const state = { ...initialState, completedDays: ['2026-01-01'] }
      const result = blockReducer(state, { type: 'LOAD_COMPLETED', payload: ['2026-06-01', '2026-06-02'] })
      expect(result.completedDays).toEqual(['2026-06-01', '2026-06-02'])
    })
  })

  describe('SET_LOADING', () => {
    it('sets loading flag', () => {
      const state = { ...initialState }
      const result = blockReducer(state, { type: 'SET_LOADING', payload: true })
      expect(result.loading).toBe(true)
    })

    it('sets loading to false', () => {
      const state = { ...initialState, loading: true }
      const result = blockReducer(state, { type: 'SET_LOADING', payload: false })
      expect(result.loading).toBe(false)
    })
  })
})
