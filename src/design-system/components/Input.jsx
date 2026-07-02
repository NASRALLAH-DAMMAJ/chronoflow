import React from 'react'

export function Input({ label, error, helperText, style, inputStyle, ...props }) {
  const hasError = !!error
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)', ...style }}>
      {label && (
        <label style={{
          fontSize: 'var(--fs-small)',
          fontWeight: 500,
          color: 'var(--clr-text)',
          fontFamily: 'var(--ff-body)',
        }}>
          {label}
        </label>
      )}
      <input
        style={{
          padding: 'var(--sp-2) var(--sp-3)',
          fontSize: 'var(--fs-body)',
          fontFamily: 'var(--ff-body)',
          color: 'var(--clr-text)',
          backgroundColor: 'var(--clr-surface)',
          border: `2px solid ${hasError ? 'var(--clr-danger)' : 'var(--clr-border)'}`,
          borderRadius: 'var(--radius-md)',
          outline: 'none',
          transition: 'border-color 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s cubic-bezier(0.4,0,0.2,1)',
          lineHeight: 1.5,
          width: '100%',
          boxSizing: 'border-box',
          ...inputStyle,
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'var(--clr-focus)'
          e.currentTarget.style.boxShadow = '0 0 0 3px var(--clr-focus)'
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = hasError ? 'var(--clr-danger)' : 'var(--clr-border)'
          e.currentTarget.style.boxShadow = 'none'
        }}
        {...props}
      />
      {(error || helperText) && (
        <span style={{
          fontSize: 'var(--fs-caption)',
          color: hasError ? 'var(--clr-danger)' : 'var(--clr-text-tertiary)',
          fontFamily: 'var(--ff-body)',
        }}>
          {error || helperText}
        </span>
      )}
    </div>
  )
}
