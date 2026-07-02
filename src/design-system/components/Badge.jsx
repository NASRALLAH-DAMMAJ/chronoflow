import React from 'react'

const badgeVariants = {
  default: { bg: 'var(--clr-bg-secondary)', color: 'var(--clr-text-secondary)' },
  primary: { bg: 'var(--clr-primary-light)', color: 'var(--clr-primary)' },
  success: { bg: 'var(--clr-success-light)', color: 'var(--clr-success)' },
  warning: { bg: 'var(--clr-warning-light)', color: 'var(--clr-warning)' },
  danger:  { bg: 'var(--clr-danger-light)',  color: 'var(--clr-danger)' },
}

export function Badge({ variant = 'default', children, style, ...props }) {
  const v = badgeVariants[variant] || badgeVariants.default
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--sp-1)',
        padding: 'var(--sp-0-5) var(--sp-2)',
        fontSize: 'var(--fs-caption)',
        fontWeight: 500,
        lineHeight: 1.4,
        borderRadius: 'var(--radius-full)',
        backgroundColor: v.bg,
        color: v.color,
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  )
}
