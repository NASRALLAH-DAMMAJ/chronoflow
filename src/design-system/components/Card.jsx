import React from 'react'

export function Card({ children, padding = 'var(--sp-4)', variant = 'default', style, ...props }) {
  const bg = variant === 'elevated' ? 'var(--clr-surface-elevated)' : 'var(--clr-surface)'
  const shadow = variant === 'elevated' ? 'var(--shadow-modal)' : 'var(--shadow-card)'
  return (
    <div
      className="card-transition"
      style={{
        backgroundColor: bg,
        borderRadius: 'var(--radius-lg)',
        boxShadow: shadow,
        padding,
        border: '1px solid var(--clr-border)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, style, ...props }) {
  return (
    <div style={{ marginBottom: 'var(--sp-3)', ...style }} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ children, style, ...props }) {
  return (
    <div style={style} {...props}>
      {children}
    </div>
  )
}
