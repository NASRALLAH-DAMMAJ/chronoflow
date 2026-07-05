import React, { useState, useEffect, useCallback } from 'react'
import { taskQueue } from '../lib/taskQueue'
import ProgressBar from './ProgressBar'

const styles = {
  container: {
    position: 'fixed',
    bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
    right: 16,
    zIndex: 9999,
    fontFamily: 'var(--ff-body, Inter, sans-serif)',
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    backgroundColor: 'var(--clr-accent, #6366F1)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    fontSize: 16,
    fontWeight: 600,
    transition: 'transform 0.2s ease',
    border: 'none',
    outline: 'none',
  },
  badgeHover: {
    transform: 'scale(1.05)',
  },
  panel: {
    position: 'absolute',
    bottom: 56,
    right: 0,
    width: 280,
    backgroundColor: 'var(--clr-card, #fff)',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    padding: 12,
    maxHeight: 300,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  taskItem: {
    padding: '8px 0',
    borderBottom: '1px solid var(--clr-border, #eee)',
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskLabel: {
    fontSize: 13,
    color: 'var(--clr-text, #333)',
    fontWeight: 500,
  },
  taskStatus: {
    fontSize: 11,
    padding: '2px 6px',
    borderRadius: 4,
    fontWeight: 500,
  },
  statusRunning: { backgroundColor: '#DBEAFE', color: '#2563EB' },
  statusCompleted: { backgroundColor: '#D1FAE5', color: '#059669' },
  statusError: { backgroundColor: '#FEE2E2', color: '#DC2626' },
  statusCancelled: { backgroundColor: '#F3F4F6', color: '#6B7280' },
  statusPending: { backgroundColor: '#FEF3C7', color: '#D97706' },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    color: 'var(--clr-text-secondary, #888)',
    padding: 4,
    lineHeight: 1,
  },
}

const statusLabels = {
  pending: 'Queued',
  running: 'Running',
  completed: 'Done',
  error: 'Failed',
  cancelled: 'Cancelled',
}

export default function TaskIndicator() {
  const [tasks, setTasks] = useState([])
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)

  const refresh = useCallback(() => {
    setTasks(taskQueue.getTasks())
  }, [])

  useEffect(() => {
    return taskQueue.subscribe(refresh)
  }, [refresh])

  const activeCount = tasks.filter(t => t.status === 'running' || t.status === 'pending').length

  if (tasks.length === 0) return null

  return (
    <div style={styles.container}>
      {expanded && (
        <div style={styles.panel}>
          <button
            style={styles.closeBtn}
            onClick={() => setExpanded(false)}
            aria-label="Close task list"
          >
            ✕
          </button>
          {tasks.map(task => (
            <div key={task.id} style={styles.taskItem}>
              <div style={styles.taskHeader}>
                <span style={styles.taskLabel}>{task.label}</span>
                <span style={{
                  ...styles.taskStatus,
                  ...(styles[`status${task.status.charAt(0).toUpperCase() + task.status.slice(1)}`] || {}),
                }}>
                  {statusLabels[task.status] || task.status}
                </span>
              </div>
              {task.status === 'running' && (
                <ProgressBar
                  value={task.progress}
                  variant={task.progress > 80 ? 'success' : 'primary'}
                  height="sm"
                  animated
                />
              )}
            </div>
          ))}
        </div>
      )}
      <button
        style={{
          ...styles.badge,
          ...(hovered ? styles.badgeHover : {}),
        }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`${activeCount} active tasks`}
        aria-expanded={expanded}
      >
        {activeCount > 0 ? activeCount : tasks.length}
      </button>
    </div>
  )
}
