import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef, useState } from 'react'
import { blockReducer, initialState, loadCompletedDays, saveCompletedDays, computeStreak } from './reducer'
import { getTodayStr, MINUTES_IN_DAY } from './constants'
import { useSupabase } from '../lib/SupabaseContext'
import { fetchBlocks, upsertBlocks, deleteBlock, archiveBlock, restoreBlockToDate, restoreBlockToTime, fetchArchivedBlockById } from '../lib/blocks'
import { migrateLocalStorage } from '../lib/migrate'
import { isAuthError } from '../lib/retry'
import { taskQueue } from '../lib/taskQueue'
import { seedBlocks, putBlocks, removeBlock, markBlockArchived, enqueueSyncAction, getBlocksByDate, blockToDbRecord } from '../lib/db'

const StoreContext = createContext(null)

const INIT_TIMEOUT_MS = 8000

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
  const saveQueueRef = useRef([])
  const savingRef = useRef(false)
  const stateRef = useRef(state)
  stateRef.current = state
  const [dbError, setDbError] = useState(null)

  useEffect(() => {
    if (!user || initFetched.current) return
    initFetched.current = true
    userIdRef.current = user.id
    const currentUser = user.id
    const initTimer = setTimeout(() => {
      if (userIdRef.current === currentUser) {
        setDbError('Init timed out — check your connection')
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }, INIT_TIMEOUT_MS)
    ;(async () => {
      try {
        await migrateLocalStorage(supabase, user.id).catch(err => {
          console.error('[Store] migrateLocalStorage failed:', err)
        })
        if (userIdRef.current !== currentUser) return
        const blocks = await fetchBlocks(supabase, today)
        if (userIdRef.current !== currentUser) return
        seedBlocks(blocks.map(b => blockToDbRecord(b, today, user.id))).catch(() => {})
        dispatch({ type: 'LOAD_BLOCKS', payload: blocks })
      } catch (err) {
        console.error('[Store] Init failed:', err)
        if (isAuthError(err)) {
          setDbError('Session expired — please log in again')
        } else {
          setDbError('Init failed: ' + err.message)
        }
        dispatch({ type: 'LOAD_BLOCKS', payload: [] })
      } finally {
        clearTimeout(initTimer)
        if (userIdRef.current === currentUser) {
          hasLoadedOnce.current = true
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      }
    })()
    return () => clearTimeout(initTimer)
  }, [user, supabase, today])

  const processSaveQueue = useCallback(async () => {
    if (savingRef.current || saveQueueRef.current.length === 0) return
    savingRef.current = true
    while (saveQueueRef.current.length > 0) {
      const { dateStr, blocks, userId, resolve } = saveQueueRef.current.pop()
      try {
        const records = blocks.map(b => blockToDbRecord(b, dateStr, userId))
        putBlocks(records).catch(() => {})
        await upsertBlocks(supabase, dateStr, blocks, userId)
        setDbError(null)
        resolve()
      } catch (err) {
        console.error('[Store] Save failed:', err)
        const records = blocks.map(b => blockToDbRecord(b, dateStr, userId))
        enqueueSyncAction({ action: 'upsert', table: 'blocks', record_id: '', payload: { blocks: records } }).catch(() => {})
        if (isAuthError(err)) {
          setDbError('Session expired — please log in again')
        } else {
          setDbError('Save failed: ' + (err.message || 'unknown error'))
        }
        resolve()
      }
    }
    savingRef.current = false
  }, [supabase])

  const saveToDb = useCallback((dateStr, blocks) => {
    if (!user || !supabase || !dateStr) return Promise.resolve()
    return new Promise(resolve => {
      saveQueueRef.current.push({ dateStr, blocks, userId: user.id, resolve })
      processSaveQueue()
    })
  }, [user, supabase, processSaveQueue])

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
      saveToDb(state.dateStr, state.blocks)
      saveTimerRef.current = null
    }, 0)
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
    getBlocksByDate(ds).then(localBlocks => {
      if (gen !== genRef.current) return
      if (localBlocks.length > 0) {
        dispatch({ type: 'LOAD_BLOCKS', payload: localBlocks })
      }
    }).catch(() => {})
    taskQueue.add(
      async ({ onProgress }) => {
        onProgress(10)
        const blocks = await fetchBlocks(supabase, ds)
        onProgress(100)
        if (gen !== genRef.current) return
        dispatch({ type: 'LOAD_BLOCKS', payload: blocks })
        seedBlocks(blocks.map(b => blockToDbRecord(b, ds, user.id))).catch(() => {})
      },
      {
        label: 'Loading day...',
        priority: 'high',
        timeout: 15000,
      }
    )
  }, [supabase, user, flushSave])

  const addBlock = useCallback((block) => {
    dispatch({ type: 'ADD_BLOCK', payload: block })
  }, [])

  const updateBlock = useCallback((id, changes) => {
    dispatch({ type: 'UPDATE_BLOCK', payload: { id, ...changes } })
  }, [])

  const deleteBlockAction = useCallback((id) => {
    dispatch({ type: 'DELETE_BLOCK', payload: { id } })
    removeBlock(id).catch(() => {})
    taskQueue.add(
      async () => {
        await deleteBlock(supabase, id)
      },
      { label: 'Deleting block...', priority: 'normal', timeout: 10000 }
    )
  }, [supabase])

  const archiveBlockAction = useCallback((id) => {
    dispatch({ type: 'DELETE_BLOCK', payload: { id } })
    markBlockArchived(id).catch(() => {})
    taskQueue.add(
      async () => {
        await archiveBlock(supabase, id)
      },
      { label: 'Archiving block...', priority: 'normal', timeout: 10000 }
    )
  }, [supabase])

  const restoreBlockAction = useCallback(async (id) => {
    const block = await fetchArchivedBlockById(supabase, user.id, id)
    if (!block) return
    const restored = { ...block, archived: false, date: stateRef.current.dateStr }
    dispatch({ type: 'ADD_BLOCK', payload: restored })
    taskQueue.add(
      async () => {
        await restoreBlockToDate(supabase, id, stateRef.current.dateStr)
      },
      { label: 'Restoring block...', priority: 'normal', timeout: 10000 }
    )
  }, [supabase, user])

  const restoreDroppedBlock = useCallback(async (id, startMin, endMin) => {
    const block = await fetchArchivedBlockById(supabase, user.id, id)
    if (!block) return
    const duration = endMin <= startMin
      ? endMin + MINUTES_IN_DAY - startMin
      : endMin - startMin
    const restored = {
      ...block,
      archived: false,
      date: stateRef.current.dateStr,
      start: startMin,
      end: endMin,
    }
    dispatch({ type: 'ADD_BLOCK', payload: restored })
    taskQueue.add(
      async () => {
        await restoreBlockToTime(supabase, id, stateRef.current.dateStr, startMin, duration)
      },
      { label: 'Restoring block...', priority: 'normal', timeout: 10000 }
    )
  }, [supabase, user])

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

  const toggleLock = useCallback((id) => {
    dispatch({ type: 'TOGGLE_LOCK', payload: { id } })
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
    dbError,
    goToDate,
    addBlock,
    updateBlock,
    deleteBlock: deleteBlockAction,
    archiveBlock: archiveBlockAction,
    restoreBlock: restoreBlockAction,
    restoreDroppedBlock,
    moveBlock,
    resizeBlock,
    resizeBlockStart,
    selectBlock,
    toggleLock,
    completeDay,
  }), [state.blocks, state.dateStr, state.loaded, state.loading, state.selectedId, state.completedDays, streak, dbError, goToDate, addBlock, updateBlock, deleteBlockAction, archiveBlockAction, restoreBlockAction, restoreDroppedBlock, moveBlock, resizeBlock, resizeBlockStart, selectBlock, toggleLock, completeDay])

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
