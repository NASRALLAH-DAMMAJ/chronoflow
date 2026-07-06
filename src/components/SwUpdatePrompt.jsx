import React, { useState, useEffect, useCallback } from 'react'

let applyRef = null

export default function SwUpdatePrompt() {
  const [visible, setVisible] = useState(false)

  const handleUpdate = useCallback(() => {
    applyRef?.()
  }, [])

  useEffect(() => {
    function onUpdate(e) {
      applyRef = e.detail.applyUpdate
      setVisible(true)
    }

    window.addEventListener('sw-update-available', onUpdate)
    return () => window.removeEventListener('sw-update-available', onUpdate)
  }, [])

  if (!visible) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="animate-slide-up"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10001,
        padding: 'var(--sp-3) var(--sp-4)',
        paddingBottom: 'calc(var(--sp-3) + env(safe-area-inset-bottom, 0px))',
        backgroundColor: 'var(--clr-bg-secondary)',
        borderTop: '1px solid var(--clr-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--sp-3)',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
      }}
    >
      <span style={{
        fontSize: 'var(--fs-small)',
        color: 'var(--clr-text)',
        fontWeight: 500,
        flex: 1,
      }}>
        New version available
      </span>
      <button
        onClick={handleUpdate}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--sp-1-5)',
          fontFamily: 'var(--ff-body)',
          fontWeight: 600,
          fontSize: 'var(--fs-small)',
          lineHeight: 1,
          padding: 'var(--sp-1-5) var(--sp-3)',
          borderRadius: 'var(--radius-md)',
          border: 'none',
          cursor: 'pointer',
          backgroundColor: 'var(--clr-primary)',
          color: 'var(--clr-primary-text)',
          outline: 'none',
          transition: 'background-color 0.2s cubic-bezier(0.4,0,0.2,1)',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--clr-primary-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--clr-primary)' }}
      >
        Refresh to update
      </button>
    </div>
  )
}
