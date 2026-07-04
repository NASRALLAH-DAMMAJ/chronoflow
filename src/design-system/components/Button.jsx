import React from 'react'

const variants = {
  primary: {
    backgroundColor: 'var(--clr-primary)',
    color: 'var(--clr-primary-text)',
    border: '2px solid transparent',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: 'var(--clr-text)',
    border: '2px solid var(--clr-border)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--clr-text-secondary)',
    border: '2px solid transparent',
  },
  danger: {
    backgroundColor: 'var(--clr-danger)',
    color: '#FFFFFF',
    border: '2px solid transparent',
  },
}

const sizes = {
  sm:   { padding: 'var(--sp-1) var(--sp-2)', fontSize: 'var(--fs-small)',     gap: 'var(--sp-1)' },
  md:   { padding: 'var(--sp-1-5) var(--sp-3)', fontSize: 'var(--fs-body)',     gap: 'var(--sp-1-5)' },
  lg:   { padding: 'var(--sp-2) var(--sp-4)',   fontSize: 'var(--fs-body-large)', gap: 'var(--sp-2)' },
}

export function Button({ variant = 'primary', size = 'md', children, onClick, disabled, type = 'button', style, ...props }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-1-5)',
        fontFamily: 'var(--ff-body)',
        fontWeight: 500,
        lineHeight: 1,
        borderRadius: 'var(--radius-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        willChange: 'background-color, border-color, color, box-shadow',
        outline: 'none',
        ...variants[variant],
        ...sizes[size],
        ...style,
      }}
      onMouseEnter={e => {
        if (!disabled) {
          const bgMap = { primary: 'var(--clr-primary-hover)', danger: 'var(--clr-danger-hover)' }
          if (bgMap[variant]) e.currentTarget.style.backgroundColor = bgMap[variant]
          if (variant === 'secondary') e.currentTarget.style.borderColor = 'var(--clr-border-strong)'
          if (variant === 'ghost') e.currentTarget.style.color = 'var(--clr-text)'
        }
      }}
      onMouseLeave={e => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = variants[variant].backgroundColor
          e.currentTarget.style.border = variants[variant].border
          e.currentTarget.style.color = variants[variant].color
        }
      }}
      onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 3px var(--clr-focus)' }}
      onBlur={e => { e.currentTarget.style.boxShadow = 'none' }}
      {...props}
    >
      {children}
    </button>
  )
}
