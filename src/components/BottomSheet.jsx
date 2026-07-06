import React, { useEffect, useRef, useCallback, useState } from 'react'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export default function BottomSheet({ isOpen, onClose, children, snapPoint = 60 }) {
  const sheetRef = useRef(null)
  const contentRef = useRef(null)
  const previousFocusRef = useRef(null)
  const touchStartRef = useRef(null)
  const touchCurrentRef = useRef(null)
  const [translateY, setTranslateY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [sheetHeight, setSheetHeight] = useState(0)

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement
      document.body.style.overflow = 'hidden'
      const timer = setTimeout(() => {
        const first = contentRef.current?.querySelector(FOCUSABLE)
        if (first) first.focus()
      }, 50)
      return () => {
        clearTimeout(timer)
        document.body.style.overflow = ''
      }
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus()
    }
  }, [isOpen])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key !== 'Tab') return
    const focusable = contentRef.current?.querySelectorAll(FOCUSABLE)
    if (!focusable || focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  useEffect(() => {
    if (!sheetRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setSheetHeight(e.contentRect.height)
    })
    ro.observe(sheetRef.current)
    return () => ro.disconnect()
  }, [isOpen])

  const snapPixels = (percent) => (window.innerHeight * percent) / 100

  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = {
      y: e.touches[0].clientY,
      sheetY: translateY,
    }
    touchCurrentRef.current = e.touches[0].clientY
    setIsDragging(true)
  }, [translateY])

  const handleTouchMove = useCallback((e) => {
    if (!touchStartRef.current) return
    const currentY = e.touches[0].clientY
    touchCurrentRef.current = currentY
    const delta = currentY - touchStartRef.current.y
    const newY = touchStartRef.current.sheetY + delta
    const minTranslate = -(sheetHeight - snapPixels(30))
    setTranslateY(Math.max(minTranslate, Math.min(0, newY)))
  }, [sheetHeight])

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current) return
    const velocity = touchCurrentRef.current
      ? (touchCurrentRef.current - touchStartRef.current.y)
      : 0
    setIsDragging(false)
    touchStartRef.current = null
    touchCurrentRef.current = null

    if (velocity > 80 || translateY > -(sheetHeight * 0.4)) {
      onClose()
    } else {
      const snaps = [snapPixels(30), snapPixels(60), snapPixels(90)]
      let closest = snapPixels(snapPoint)
      let minDist = Infinity
      for (const s of snaps) {
        const target = -(sheetHeight - s)
        const dist = Math.abs(translateY - target)
        if (dist < minDist) {
          minDist = dist
          closest = target
        }
      }
      setTranslateY(closest)
    }
  }, [translateY, sheetHeight, snapPoint, onClose])

  useEffect(() => {
    if (isOpen) {
      const target = -(sheetHeight - snapPixels(snapPoint))
      setTranslateY(target)
    } else {
      setTranslateY(0)
    }
  }, [isOpen, sheetHeight, snapPoint])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bottom sheet"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        backgroundColor: 'var(--clr-overlay)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: 'cf-fade-in 0.2s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div
        ref={sheetRef}
        style={{
          backgroundColor: 'var(--clr-surface-elevated)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          boxShadow: 'var(--shadow-overlay)',
          borderTop: '1px solid var(--clr-border)',
          maxHeight: '90vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform',
          touchAction: 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 'var(--sp-3) 0 var(--sp-2)',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: 'var(--clr-border-strong)',
            }}
          />
        </div>
        <div ref={contentRef} style={{ padding: '0 var(--sp-4) var(--sp-4)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
