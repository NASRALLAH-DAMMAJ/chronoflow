import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { StoreProvider, useStore, getTodayStr, ROUTES, LS_KEYS, MINUTES_IN_DAY, SNAP_MINUTES } from './store'
import { Dial } from './components/Dial'
import { BlockForm } from './components/BlockForm'
import { BlockList } from './components/BlockList'
import { Onboarding } from './components/Onboarding'
import TaskIndicator from './components/TaskIndicator'
import { ToastProvider, useToast } from './components/Toast'
import { Button, Badge, Card } from './design-system/components'
import { useDarkMode } from './design-system/hooks/useDarkMode'
import { IconPlus, IconSun, IconMoon, IconChevronLeft, IconChevronRight } from './design-system/icons'
import { minutesToStr, formatDateLabel, snapToGrid } from './utils'
import { useSupabase } from './lib/SupabaseContext'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineBanner from './components/OfflineBanner'
import NetworkIndicator from './components/NetworkIndicator'
import ArchiveList from './components/ArchiveList'
import HeaderMenu from './components/HeaderMenu'
import { useSessionMonitor } from './hooks/useSessionMonitor'
import { useSwipe, haptic } from './hooks/useSwipe'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './pages/ProtectedRoute'

const SettingsPage = React.lazy(() => import('./pages/SettingsPage'))
const RecurringRulesPage = React.lazy(() => import('./pages/RecurringRulesPage'))
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'))

function AppContent() {
  const navigate = useNavigate()
  const { isDark, toggle } = useDarkMode()
  const { supabase } = useSupabase()
  const { blocks, dateStr, selectedId, completedDays, loading, streak, dbError, archiveVersion, addBlock, updateBlock, deleteBlock, deleteArchivedBlock, archiveBlock, restoreBlock, restoreDroppedBlock, moveBlock, resizeBlock, resizeBlockStart, selectBlock, toggleLock, goToDate, completeDay } = useStore()
  const toast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editingBlock, setEditingBlock] = useState(null)
  const [placement, setPlacement] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem(LS_KEYS.ONBOARDED) } catch { return true }
  })

  function dismissOnboarding() {
    try { localStorage.setItem(LS_KEYS.ONBOARDED, '1') } catch {}
    setShowOnboarding(false)
  }

  function handleDelete(blockId) {
    const block = blocks.find(b => b.id === blockId)
    if (block?.locked) {
      if (!window.confirm(`"${block.label}" is locked. Delete anyway?`)) return
    }
    haptic('medium')
    deleteBlock(blockId)
    toast.success('Block deleted')
  }

  function handleArchive(blockId) {
    const block = blocks.find(b => b.id === blockId)
    if (block?.locked) {
      if (!window.confirm(`"${block.label}" is locked. Archive anyway?`)) return
    }
    haptic('medium')
    archiveBlock(blockId)
    toast.success('Block archived')
  }

  function handleEdit(block) {
    setEditingBlock(block)
    setShowForm(false)
    setPlacement(null)
  }

  function closeForm() {
    setShowForm(false)
    setEditingBlock(null)
  }

  function handlePlaceBlock(label, category) {
    setPlacement({ label, category })
    setShowForm(false)
  }

  function handlePlaceOnDial(startMin, endMin) {
    let start = snapToGrid(startMin, SNAP_MINUTES)
    let end = snapToGrid(endMin, SNAP_MINUTES)

    if (end === start) end = (start + SNAP_MINUTES) % MINUTES_IN_DAY
    haptic('success')
    addBlock({
      id: crypto.randomUUID(),
      start: start % MINUTES_IN_DAY,
      end,
      label: placement.label,
      category: placement.category,
      tags: [],
    })
    toast.success('Block added')
    setPlacement(null)
  }

  function cancelPlacement() {
    setPlacement(null)
  }

  function goToDay(delta) {
    const d = new Date(dateStr + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    goToDate(d)
  }

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => goToDay(1),
    onSwipeRight: () => goToDay(-1),
  })

  const todayStr = getTodayStr()
  const isToday = dateStr === todayStr
  const [contextBlockId, setContextBlockId] = useState(null)
  const contextRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (contextRef.current && !contextRef.current.contains(e.target)) {
        setContextBlockId(null)
      }
    }
    if (contextBlockId) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [contextBlockId])

  const formOpen = showForm || editingBlock

  useEffect(() => {
    function handleKeyDown(e) {
      if (formOpen) return
      if (e.key === 'PageUp') { e.preventDefault(); goToDay(-1) }
      if (e.key === 'PageDown') { e.preventDefault(); goToDay(1) }
      if (e.key === 'Home') { e.preventDefault(); goToDate(new Date()) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [formOpen, goToDate])

  return (
    <>
      {showOnboarding && <Onboarding onDismiss={dismissOnboarding} />}
      <div
        id="main-content"
        tabIndex={-1}
        className="animate-fade-in"
        {...swipeHandlers}
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          padding: 'var(--sp-6) var(--sp-4)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
      <header className="animate-fade-in-up" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--sp-6)',
        gap: 'var(--sp-3)',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 'var(--fs-headline)', fontWeight: 700, color: 'var(--clr-text)', margin: 0 }}>
            ChronoFlow
          </h1>
          <NetworkIndicator />
          <span style={{ fontSize: 'var(--fs-small)', color: 'var(--clr-text-secondary)', whiteSpace: 'nowrap' }}>
            · {formatDateLabel(dateStr)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" onClick={() => goToDay(-1)} aria-label="Previous day" style={{ display: 'flex', padding: '4px 6px' }}>
            <IconChevronLeft />
          </Button>
          <input
            type="date"
            value={dateStr}
            onChange={e => goToDate(new Date(e.target.value + 'T00:00:00'))}
            style={{
              fontSize: 13,
              padding: '4px 8px',
              fontFamily: 'var(--ff-body)',
              color: 'var(--clr-text)',
              backgroundColor: 'var(--clr-surface)',
              border: '2px solid var(--clr-border)',
              borderRadius: 6,
              maxWidth: 140,
            }}
          />
          <Button variant="ghost" size="sm" onClick={() => goToDay(1)} aria-label="Next day" style={{ display: 'flex', padding: '4px 6px' }}>
            <IconChevronRight />
          </Button>
          {!isToday && (
            <Button variant="ghost" size="sm" onClick={() => goToDate()}>
              Today
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={toggle} aria-label={isDark ? 'Switch to light' : 'Switch to dark'} style={{ display: 'flex', padding: '4px 6px' }}>
            {isDark ? <IconSun /> : <IconMoon />}
          </Button>
          <HeaderMenu />
        </div>
      </header>

      {dbError && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          color: '#991b1b',
          padding: '10px 16px',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <strong>DB Error:</strong> {dbError}
        </div>
      )}

      <div className="app-grid animate-fade-in-up" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: 'var(--sp-6)',
        alignItems: 'start',
        flex: 1,
        animationDelay: '0.1s',
      }}>
        <div className="animate-fade-in-scale" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {placement && (
            <div className="animate-slide-down" style={{
              fontSize: 13, color: 'var(--clr-text-secondary)',
              backgroundColor: 'var(--clr-surface)',
              padding: '6px 14px', borderRadius: 6,
              border: '1px solid var(--clr-border)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              Drag on dial to place <strong>{placement.label}</strong>
              <button onClick={cancelPlacement} aria-label="Cancel placement" style={{
                border: 'none', background: 'none',
                color: 'var(--clr-text-tertiary)', cursor: 'pointer', fontSize: 14, padding: 0,
              }}>✕</button>
            </div>
          )}
          <Dial
            blocks={blocks}
            selectedId={selectedId}
            placement={placement}
            onMoveBlock={moveBlock}
            onResizeBlock={resizeBlock}
            onResizeBlockStart={resizeBlockStart}
            onSelectBlock={selectBlock}
            onPlaceBlock={handlePlaceOnDial}
            onDropArchive={restoreDroppedBlock}
            size={380}
          />
        </div>

        <div className="animate-slide-in-right" style={{ animationDelay: '0.15s' }}>
          <Card padding="var(--sp-4)">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 'var(--fs-subtitle)', fontWeight: 600, color: 'var(--clr-text)', margin: 0 }}>
                Blocks
              </h2>
              <Button variant="primary" size="sm" onClick={() => { setEditingBlock(null); setShowForm(!showForm); setPlacement(null) }}>
                <IconPlus /> Add
              </Button>
            </div>

            {formOpen && (
              <div className="animate-slide-down" style={{ marginBottom: 16 }}>
                <BlockForm
                  block={editingBlock}
                  onUpdateBlock={updateBlock}
                  onPlaceBlock={handlePlaceBlock}
                  onClose={closeForm}
                  onToggleLock={editingBlock ? toggleLock : undefined}
                />
              </div>
            )}

            <ArchiveList onRestore={restoreBlock} onDelete={deleteArchivedBlock} archiveVersion={archiveVersion} />
            <div aria-live="polite" aria-label="Time blocks">
              <BlockList
                blocks={blocks}
                selectedId={selectedId}
                onSelectBlock={selectBlock}
                onDeleteBlock={handleDelete}
                onArchiveBlock={handleArchive}
                onEditBlock={handleEdit}
                onToggleLock={toggleLock}
                contextBlockId={contextBlockId}
                onContextMenu={setContextBlockId}
                contextRef={contextRef}
                onEditRule={() => navigate(ROUTES.RULES)}
              />
            </div>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--clr-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div aria-live="polite" style={{ fontSize: 13, color: 'var(--clr-text-tertiary)' }}>
                Streak: <strong>{streak}</strong> {streak === 1 ? 'day' : 'days'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isToday && !completedDays.includes(dateStr) && (
                  <Button variant="primary" size="sm" onClick={() => { haptic('success'); completeDay(dateStr); toast.success('Day completed! Streak +1') }}>
                    Complete day
                  </Button>
                )}
                {completedDays.includes(dateStr) && (
                  <Badge variant="default">Reviewed</Badge>
                )}
                <button
                  onClick={() => navigate(ROUTES.RULES)}
                  style={{
                    fontSize: 11, color: 'var(--clr-text-tertiary)',
                    border: 'none', background: 'none', cursor: 'pointer',
                    padding: '4px 6px', borderRadius: 4, fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Recurring Rules
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: 'var(--sp-6) 0', color: 'var(--clr-text-tertiary)', fontSize: 'var(--fs-caption)', marginTop: 'auto' }}>
        ChronoFlow · Time Awareness for Well-being · SDG 3
      </footer>
    </div>
    </>
  )
}

function PageSpinner() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--clr-text-secondary)',
      fontSize: 14,
    }}>
      Loading...
    </div>
  )
}

export default function App() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <ToastProvider>
        <OfflineBanner />
        <TaskIndicator />
        <React.Suspense fallback={<PageSpinner />}>
          <Routes>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.SETTINGS} element={
            <ProtectedRoute>
              <ErrorBoundary name="Settings">
                <SettingsPage />
              </ErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.RULES} element={
            <ProtectedRoute>
              <ErrorBoundary name="Recurring Rules">
                <RecurringRulesPage />
              </ErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ANALYTICS} element={
            <ProtectedRoute>
              <ErrorBoundary name="Analytics">
                <AnalyticsPage />
              </ErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.HOME} element={
            <ProtectedRoute>
              <StoreProvider>
                <ErrorBoundary name="Home">
                  <AppContent />
                </ErrorBoundary>
              </StoreProvider>
            </ProtectedRoute>
          } />
        </Routes>
      </React.Suspense>
      </ToastProvider>
    </>
  )
}
