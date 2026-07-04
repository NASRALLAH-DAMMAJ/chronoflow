import React from 'react'

const SIZE = 24
const STROKE = 2
const CAP = 'round'
const JOIN = 'round'

export function IconPlus({ color = 'currentColor' }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap={CAP} strokeLinejoin={JOIN}>
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function IconX({ color = 'currentColor' }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap={CAP} strokeLinejoin={JOIN}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function IconCheck({ color = 'currentColor' }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap={CAP} strokeLinejoin={JOIN}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function IconChevronLeft({ color = 'currentColor' }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap={CAP} strokeLinejoin={JOIN}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

export function IconChevronRight({ color = 'currentColor' }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap={CAP} strokeLinejoin={JOIN}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function IconChevronDown({ color = 'currentColor' }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap={CAP} strokeLinejoin={JOIN}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function IconSearch({ color = 'currentColor' }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap={CAP} strokeLinejoin={JOIN}>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function IconClock({ color = 'currentColor' }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap={CAP} strokeLinejoin={JOIN}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export function IconCalendar({ color = 'currentColor' }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap={CAP} strokeLinejoin={JOIN}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

export function IconEdit({ color = 'currentColor' }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap={CAP} strokeLinejoin={JOIN}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export function IconTrash({ color = 'currentColor' }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap={CAP} strokeLinejoin={JOIN}>
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

export function IconSun({ color = 'currentColor' }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap={CAP} strokeLinejoin={JOIN}>
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

export function IconMoon({ color = 'currentColor' }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap={CAP} strokeLinejoin={JOIN}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export function IconSettings({ color = 'currentColor' }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap={CAP} strokeLinejoin={JOIN}>
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export function IconMenu({ color = 'currentColor' }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap={CAP} strokeLinejoin={JOIN}>
      <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

export function IconArrowRight({ color = 'currentColor' }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap={CAP} strokeLinejoin={JOIN}>
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

export function IconArchive({ color = 'currentColor' }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap={CAP} strokeLinejoin={JOIN}>
      <rect x="2" y="3" width="20" height="5" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" />
    </svg>
  )
}
