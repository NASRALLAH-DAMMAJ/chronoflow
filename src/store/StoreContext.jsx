import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef } from 'react'
import { blockReducer, initialState, loadCompletedDays, saveCompletedDays, computeStreak } from './reducer'
import { getTodayStr } from './constants'
import { useSupabase } from '../lib/SupabaseContext'
import { fetchBlocks, upsertBlocks, deleteBlock, archiveBlock } from '../lib/blocks'
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
  const hasLoadedOnce = useRef(false)
  const saveTimerRef = useRef(null)
  const loadedFromServerRef = useRef(false)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    if (!user || initFetched.current) return
    initFetched.current = true
    userIdRef.current = user.id
    const currentUser = user.id
    ;(async () => {
      try {
        await migrateLocalStorage(supabase, user.id).catch(err => {
          console.error('[Store] migrateLocalStorage failed:', err)
        })
        if (userIdRef.current !== currentUser) return
        try {
          loadedFromServerRef.current = true
          const blocks = await fetchSchedule(supabase, today)
          if (userIdRef.current !== currentUser) return
          console.log('[Store] Loaded blocks from schedule:', blocks.length)
          dispatch({ type: 'LOAD_BLOCKS', payload: blocks })
        } catch (scheduleErr) {
          console.warn('[Store] fetchSchedule failed, falling back to fetchBlocks:', scheduleErr)
          try {
            loadedFromServerRef.current = true
            const blocks = await fetchBlocks(supabase, today)
            if (userIdRef.current !== currentUser) return
            console.log('[Store] Loaded blocks from DB:', blocks.length)
            dispatch({ type: 'LOAD_BLOCKS', payload: blocks })
          } catch (blocksErr) {
            console.error('[Store] fetchBlocks also failed:', blocksErr)
            dispatch({ type: 'LOAD_BLOCKS', payload: [] })
          }
        }
      } catch (err) {
        console.error('[Store] Init failed:', err)
        dispatch({ type: 'LOAD_BLOCKS', payload: [] })
      } finally {
        if (userIdRef.current === currentUser) {
          hasLoadedOnce.current = true
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      }
    })()
  }, [user, supabase, today])

  const saveToDb = useCallback((dateStr, blocks) => {
    if (!user || !supabase || !dateStr) return Promise.resolve()
    return upsertBlocks(supabase, dateStr, blocks, user.id).catch(err => {
      console.error('[Store] Failed to save blocks:', err)
    })
  }, [user, supabase])

  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    const s = stateRef.current
    if (s.loaded && user && supabase) {
      return saveToDb(s.dateStr, s.blocks)
    }
    return Promise.resolve()
  }, [user, supabase, saveToDb])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      const s = stateRef.current
      if (s.loaded && user && supabase && s.dateStr) {
        upsertBlocks(supabase, s.dateStr, s.blocks, user.id).catch(err => {
          console.error('[Store] Failed to save on unmount:', err)
        })
      }
    }
  }, [user, supabase])

  useEffect(() => {
    if (!hasLoadedOnce.current || !user || !state.loaded) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      if (loadedFromServerRef.current) {
        loadedFromServerRef.current = false
        saveTimerRef.current = null
        return
      }
      saveToDb(state.dateStr, state.blocks)
      saveTimerRef.current = null
    }, 300)
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
    }
  }, [state.dateStr, state.blocks, user, state.loaded, saveToDb])

  const goToDate = useCallback(async (date) => {
    const ds = getTodayStr(date)
    await flushSave()
    dispatch({ type: 'SET_DATE', payload: ds })
    const gen = ++genRef.current
    try {
      loadedFromServerRef.current = true
      const blocks = await fetchSchedule(supabase, ds)
      if (gen !== genRef.current) return
      dispatch({ type: 'LOAD_BLOCKS', payload: blocks })
    } catch (scheduleErr) {
      console.warn('[Store] goToDate fetchSchedule failed:', scheduleErr)
      try {
        loadedFromServerRef.current = true
        const blocks = await fetchBlocks(supabase, ds)
        if (gen !== genRef.current) return
        dispatch({ type: 'LOAD_BLOCKS', payload: blocks })
      } catch (blocksErr) {
        console.error('[Store] goToDate fetchBlocks also failed:', blocksErr)
        dispatch({ type: 'LOAD_BLOCKS', payload: [] })
      }
    }
  }, [supabase, flushSave])

  const addBlock = useCallback((block) => {
    dispatch({ type: 'ADD_BLOCK', payload: block })
  }, [])

  const updateBlock = useCallback((id, changes) => {
    dispatch({ type: 'UPDATE_BLOCK', payload: { id, ...changes } })
  }, [])

  const deleteBlockAction = useCallback((id) => {
    dispatch({ type: 'DELETE_BLOCK', payload: { id } })
    deleteBlock(supabase, id).catch(err => {
      console.error('[Store] Failed to delete block:', err)
    })
  }, [supabase])

  const archiveBlockAction = useCallback((id) => {
    dispatch({ type: 'DELETE_BLOCK', payload: { id } })
    archiveBlock(supabase, id).catch(err => {
      console.error('[Store] Failed to archive block:', err)
    })
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
    dispatch({ type: 'SELECT_BLOCK', payload: id })
  }, [])

  useEffect(() => {
    saveCompletedDays(state.completedDays)
  }, [state.completedDays])

  const completeDay = useCallback((dateStr) => {
    dispatch({ type: 'COMPLETE_DAY', payload: dateStr })
  }, [])

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
    archiveBlock: archiveBlockAction,
    moveBlock,
    resizeBlock,
    resizeBlockStart,
    selectBlock,
    completeDay,
  }), [state.blocks, state.dateStr, state.loaded, state.loading, state.selectedId, state.completedDays, streak, goToDate, addBlock, updateBlock, deleteBlockAction, archiveBlockAction, moveBlock, resizeBlock, resizeBlockStart, selectBlock, completeDay])

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
