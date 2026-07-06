import { useState, useEffect, useCallback } from 'react'
import { LS_KEYS } from '../../store/constants'

function getStoredTheme() {
  try {
    return localStorage.getItem(LS_KEYS.THEME)
  } catch {
    return null
  }
}

function setStoredTheme(value) {
  try {
    localStorage.setItem(LS_KEYS.THEME, value)
  } catch {}
}

function triggerThemeTransition() {
  const overlay = document.createElement('div')
  overlay.className = 'theme-transition-overlay active'
  document.body.appendChild(overlay)
  setTimeout(() => overlay.remove(), 400)
}

export function useDarkMode() {
  const prefersDark = typeof window !== 'undefined'
    && window.matchMedia('(prefers-color-scheme: dark)').matches

  const [isDark, setIsDark] = useState(() => {
    const stored = getStoredTheme()
    if (stored === 'dark') return true
    if (stored === 'light') return false
    return prefersDark
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      if (!getStoredTheme()) {
        setIsDark(e.matches)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggle = useCallback(() => {
    setIsDark(prev => {
      const next = !prev
      setStoredTheme(next ? 'dark' : 'light')
      triggerThemeTransition()
      return next
    })
  }, [])

  const setTheme = useCallback((value) => {
    if (value === 'system') {
      setStoredTheme(null)
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
    } else {
      setStoredTheme(value)
      setIsDark(value === 'dark')
    }
    triggerThemeTransition()
  }, [])

  return { isDark, toggle, setTheme }
}
