import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef } from 'react'
import { blockReducer, initialState, loadCompletedDays, saveCompletedDays, computeStreak } from './reducer'
import { getTodayStr } from './constants'
import { useSupabase } from '../lib/SupabaseContext'
import { fetchBlocks, upsertBlocks, deleteBlock } from '../lib/blocks'
import { fetchSchedule } from '../lib/schedule'
import { migrateLocalStorage } from '../lib/migrate'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const { supabase, user } = useSupabase()
  const today = getTodayStr()
  const [state, dispatch] = useReducer(blockReducer, {
    ...initialState,
    dateStr: today,
    blocks: [],
    completedDays: loadCompletedDays(),
    loaded: false,
    loading: true,
  })
  const initFetched = useRef(false)
  const genRef = useRef(0)
  const userIdRef = useRef(null)

  useEffect(() => {
    if (!user || initFetched.current) return
    initFetched.current = true
    userIdRef.current = user.id
    const currentUser = user.id
    ;(async () => {
      await migrateLocalStorage(supabase)
      if (userIdRef.current !== currentUser) return
      try {
        const blocks = await fetchSchedule(supabase, today)
        if (userIdRef.current !== currentUser) return
        dispatch({ type: 'LOAD_BLOCKS', payload: blocks })
      } catch {
        try {
          const blocks = await fetchBlocks(supabase, today)
          if (userIdRef.current !== currentUser) return
          dispatch({ type: 'LOAD_BLOCKS', payload: blocks })
        } catch {
          dispatch({ type: 'LOAD_BLOCKS', payload: [] })
        }
      }
      dispatch({ type: 'SET_LOADING', payload: false })
    })()
  }, [user, supabase, today])

  useEffect(() => {
    if (!state.loaded || !user || state.blocks.length === 0) return
    const timer = setTimeout(() => {
      upsertBlocks(supabase, state.dateStr, state.blocks).catch(console.error)
    }, 500)
    return () => clearTimeout(timer)
  }, [state.dateStr, state.blocks, state.loaded, user, supabase])

  const goToDate = useCallback((date) => {
    const ds = getTodayStr(date)
    dispatch({ type: 'SET_DATE', payload: ds })
    const gen = ++genRef.current
    ;(async () => {
      try {
        const blocks = await fetchSchedule(supabase, ds)
        if (gen !== genRef.current) return
        dispatch({ type: 'LOAD_BLOCKS', payload: blocks })
      } catch {
        try {
          const blocks = await fetchBlocks(supabase, ds)
          if (gen !== genRef.current) return
          dispatch({ type: 'LOAD_BLOCKS', payload: blocks })
        } catch {
          dispatch({ type: 'LOAD_BLOCKS', payload: [] })
        }
      }
    })()
  }, [supabase])

  const addBlock = useCallback((block) => {
    dispatch({ type: 'ADD_BLOCK', payload: block })
  }, [])

  const updateBlock = useCallback((id, changes) => {
    dispatch({ type: 'UPDATE_BLOCK', payload: { id, ...changes } })
  }, [])

  const deleteBlockAction = useCallback((id) => {
    dispatch({ type: 'DELETE_BLOCK', payload: { id } })
    deleteBlock(supabase, id).catch(console.error)
  }, [supabase])

  const moveBlock = useCallback((id, newStart) => {
    dispatch({ type: 'MOVE_BLOCK', payload: { id, newStart } })
  }, [])

  const resizeBlock = useCallback((id, newEnd) => {
    dispatch({ type: 'RESIZE_BLOCK', payload: { id, newEnd } })
  }, [])

  const resizeBlockStart = useCallback((id, newStart) => {
    dispatch({ type: 'RESIZE_BLOCK_START', payload: { id, newStart } })
  }, [])

  const selectBlock = useCallback((id) => {
    dispatch({ type: 'SELECT_BLOCK', payload: { id } })
  }, [])

  const completeDay = useCallback((dateStr) => {
    dispatch({ type: 'COMPLETE_DAY', payload: dateStr })
    if (!state.completedDays.includes(dateStr)) {
      saveCompletedDays([...state.completedDays, dateStr])
    }
  }, [state.completedDays])

  const streak = useMemo(() => computeStreak(state.completedDays), [state.completedDays])

  const value = useMemo(() => ({
    blocks: state.blocks,
    dateStr: state.dateStr,
    loaded: state.loaded,
    loading: state.loading,
    selectedId: state.selectedId,
    completedDays: state.completedDays,
    streak,
    goToDate,
    addBlock,
    updateBlock,
    deleteBlock: deleteBlockAction,
    moveBlock,
    resizeBlock,
    resizeBlockStart,
    selectBlock,
    completeDay,
  }), [state.blocks, state.dateStr, state.loaded, state.loading, state.selectedId, state.completedDays, streak, goToDate, addBlock, updateBlock, deleteBlockAction, moveBlock, resizeBlock, resizeBlockStart, selectBlock, completeDay])

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
