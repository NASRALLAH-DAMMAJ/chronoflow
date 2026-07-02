import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react'
import { blockReducer, initialState, loadCompletedDays, computeStreak } from './reducer'
import { getTodayStr } from './constants'

const StoreContext = createContext(null)

function loadBlocks(dateStr) {
  try {
    const raw = localStorage.getItem(`cf-blocks-${dateStr}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveBlocks(dateStr, blocks) {
  try {
    localStorage.setItem(`cf-blocks-${dateStr}`, JSON.stringify(blocks))
  } catch { /* quota exceeded - handle gracefully */ }
}

export function StoreProvider({ children }) {
  const today = getTodayStr()
  const [state, dispatch] = useReducer(blockReducer, {
    ...initialState,
    dateStr: today,
    blocks: loadBlocks(today),
    completedDays: loadCompletedDays(),
    loaded: true,
  })

  useEffect(() => {
    saveBlocks(state.dateStr, state.blocks)
  }, [state.dateStr, state.blocks])

  const goToDate = useCallback((date) => {
    const ds = getTodayStr(date)
    const blocks = loadBlocks(ds)
    dispatch({ type: 'SET_DATE', payload: ds })
    dispatch({ type: 'LOAD_BLOCKS', payload: blocks })
  }, [])

  const addBlock = useCallback((block) => {
    dispatch({ type: 'ADD_BLOCK', payload: block })
  }, [])

  const updateBlock = useCallback((id, changes) => {
    dispatch({ type: 'UPDATE_BLOCK', payload: { id, ...changes } })
  }, [])

  const deleteBlock = useCallback((id) => {
    dispatch({ type: 'DELETE_BLOCK', payload: { id } })
  }, [])

  const moveBlock = useCallback((id, newStart) => {
    dispatch({ type: 'MOVE_BLOCK', payload: { id, newStart } })
  }, [])

  const resizeBlock = useCallback((id, newEnd) => {
    dispatch({ type: 'RESIZE_BLOCK', payload: { id, newEnd } })
  }, [])

  const selectBlock = useCallback((id) => {
    dispatch({ type: 'SELECT_BLOCK', payload: { id } })
  }, [])

  const completeDay = useCallback((dateStr) => {
    dispatch({ type: 'COMPLETE_DAY', payload: dateStr })
  }, [])

  const streak = useMemo(() => computeStreak(state.completedDays), [state.completedDays])

  return (
    <StoreContext.Provider value={{
      blocks: state.blocks,
      dateStr: state.dateStr,
      loaded: state.loaded,
      selectedId: state.selectedId,
      completedDays: state.completedDays,
      streak,
      goToDate,
      addBlock,
      updateBlock,
      deleteBlock,
      moveBlock,
      resizeBlock,
      selectBlock,
      completeDay,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
