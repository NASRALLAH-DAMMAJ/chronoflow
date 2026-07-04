import { useState, useEffect, useCallback } from 'react'

function getStoredTheme() {
  try {
    return localStorage.getItem('cf-theme')
  } catch {
    return null
  }
}

function setStoredTheme(value) {
  try {
    localStorage.setItem('cf-theme', value)
  } catch {}
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
      return next
    })
  }, [])

  return { isDark, toggle }
}
