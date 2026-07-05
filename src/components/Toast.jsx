import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  const removeToast = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id])
      delete timersRef.current[id]
    }
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((message, options = {}) => {
    const id = `toast-${++toastId}`
    const toast = {
      id,
      message,
      variant: options.variant || 'info',
      duration: options.duration || (options.variant === 'error' ? 6000 : 3000),
    }
    setToasts(prev => [...prev, toast])
    timersRef.current[id] = setTimeout(() => removeToast(id), toast.duration)
    return id
  }, [removeToast])

  const success = useCallback((msg, opts) => addToast(msg, { ...opts, variant: 'success' }), [addToast])
  const error = useCallback((msg, opts) => addToast(msg, { ...opts, variant: 'error' }), [addToast])
  const warning = useCallback((msg, opts) => addToast(msg, { ...opts, variant: 'warning' }), [addToast])
  const info = useCallback((msg, opts) => addToast(msg, { ...opts, variant: 'info' }), [addToast])

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const variantStyles = {
  success: { bg: '#D1FAE5', border: '#6EE7B7', color: '#065F46', icon: '✓' },
  error: { bg: '#FEE2E2', border: '#FCA5A5', color: '#991B1B', icon: '✕' },
  warning: { bg: '#FEF3C7', border: '#FCD34D', color: '#92400E', icon: '⚠' },
  info: { bg: '#DBEAFE', border: '#93C5FD', color: '#1E40AF', icon: 'ℹ' },
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 400,
        width: '90%',
      }}
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }) {
  const style = variantStyles[toast.variant] || variantStyles.info

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 8,
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
        fontSize: 13,
        fontWeight: 500,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        animation: 'slideUp 0.2s ease-out',
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>{style.icon}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss notification"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: style.color,
          opacity: 0.6,
          fontSize: 14,
          padding: 2,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  )
}
