import React from 'react'

const styles = {
  container: (height) => ({
    width: '100%',
    height: height === 'sm' ? 4 : height === 'lg' ? 12 : 8,
    borderRadius: 999,
    backgroundColor: 'var(--clr-border)',
    overflow: 'hidden',
    position: 'relative',
  }),
  bar: (variant, width, animated) => ({
    height: '100%',
    width: `${width}%`,
    borderRadius: 999,
    transition: animated ? 'width 0.3s ease' : 'none',
    backgroundColor: variant === 'success' ? '#4ADE80'
      : variant === 'warning' ? '#FBBF24'
      : variant === 'error' ? '#F87171'
      : 'var(--clr-accent, #6366F1)',
  }),
  label: {
    fontSize: 12,
    color: 'var(--clr-text-secondary, #888)',
    marginTop: 4,
    textAlign: 'right',
  },
}

export default function ProgressBar({
  value = 0,
  variant = 'primary',
  height = 'md',
  animated = false,
  showLabel = false,
  className = '',
  style = {},
}) {
  const clampedValue = Math.min(100, Math.max(0, value))
  const prefersReduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  return (
    <div className={className} style={{ ...styles.container(height), ...style }}>
      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        style={styles.bar(variant, clampedValue, !prefersReduced && animated)}
      />
      {showLabel && (
        <div style={styles.label}>{Math.round(clampedValue)}%</div>
      )}
    </div>
  )
}
