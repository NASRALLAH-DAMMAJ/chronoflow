const BASE = 4

export function sp(n) {
  return `${n * BASE}px`
}

export const space = {
  0:   '0px',
  0.5: '2px',
  1:   sp(1),
  1.5: sp(1.5),
  2:   sp(2),
  3:   sp(3),
  4:   sp(4),
  5:   sp(5),
  6:   sp(6),
  8:   sp(8),
  10:  sp(10),
  12:  sp(12),
  16:  sp(16),
  20:  sp(20),
  24:  sp(24),
  32:  sp(32),
  40:  sp(40),
  48:  sp(48),
  64:  sp(64),
}

export function getSpacingVars() {
  const vars = {}
  for (const [key, val] of Object.entries(space)) {
    vars[`--sp-${key}`] = val
  }
  return vars
}
