export const duration = {
  instant:  '0ms',
  fast:     '100ms',
  normal:   '200ms',
  slow:     '300ms',
  slower:   '500ms',
}

export const easing = {
  default:   'cubic-bezier(0.4, 0, 0.2, 1)',
  in:        'cubic-bezier(0.4, 0, 1, 1)',
  out:       'cubic-bezier(0, 0, 0.2, 1)',
  spring:    'cubic-bezier(0.34, 1.56, 0.64, 1)',
}

export const stagger = {
  fast:   '30ms',
  normal: '50ms',
  slow:   '80ms',
}

export const distance = {
  near:   '4px',
  medium: '8px',
  far:    '16px',
}

export function getTransition(properties = ['all'], dur = duration.normal, ease = easing.default) {
  return properties.map(p => `${p} ${dur} ${ease}`).join(', ')
}
