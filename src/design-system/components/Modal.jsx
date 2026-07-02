import React, { useEffect, useRef } from 'react'
import { IconX } from '../icons'

export function Modal({ isOpen, onClose, title, children, width = '480px' }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--clr-overlay)',
        animation: 'cf-fade-in 0.2s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div style={{
        width,
        maxWidth: 'calc(100vw - var(--sp-8))',
        maxHeight: 'calc(100vh - var(--sp-8))',
        overflowY: 'auto',
        backgroundColor: 'var(--clr-surface-elevated)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-overlay)',
        border: '1px solid var(--clr-border)',
        animation: 'cf-slide-up 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--sp-4) var(--sp-5)',
          borderBottom: '1px solid var(--clr-border)',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: 'var(--fs-subtitle)',
            fontWeight: 600,
            color: 'var(--clr-text)',
            fontFamily: 'var(--ff-body)',
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'transparent',
              color: 'var(--clr-text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--clr-bg-secondary)'; e.currentTarget.style.color = 'var(--clr-text)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--clr-text-secondary)' }}
          >
            <IconX />
          </button>
        </div>
        <div style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
