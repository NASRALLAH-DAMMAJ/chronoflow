import { useState, useEffect, useCallback } from 'react'

export function useDarkMode() {
  const prefersDark = typeof window !== 'undefined'
    && window.matchMedia('(prefers-color-scheme: dark)').matches

  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('cf-theme')
    if (stored === 'dark') return true
    if (stored === 'light') return false
    return prefersDark
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      if (!localStorage.getItem('cf-theme')) {
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
      localStorage.setItem('cf-theme', next ? 'dark' : 'light')
      return next
    })
  }, [])

  return { isDark, toggle }
}
