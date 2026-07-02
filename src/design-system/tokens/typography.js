export const typeface = {
  body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
  mono: `'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace`,
}

export const scale = {
  caption:  { size: 'clamp(0.6875rem, 0.66rem + 0.14vw, 0.75rem)',    lineHeight: 1.4, weight: 400 },
  small:    { size: 'clamp(0.75rem, 0.71rem + 0.18vw, 0.875rem)',     lineHeight: 1.5, weight: 400 },
  body:     { size: 'clamp(0.875rem, 0.82rem + 0.27vw, 1rem)',        lineHeight: 1.6, weight: 400 },
  bodyLarge:{ size: 'clamp(1rem, 0.93rem + 0.36vw, 1.125rem)',        lineHeight: 1.6, weight: 400 },
  subtitle: { size: 'clamp(1.125rem, 1.04rem + 0.43vw, 1.25rem)',     lineHeight: 1.4, weight: 500 },
  headline: { size: 'clamp(1.5rem, 1.32rem + 0.89vw, 2rem)',          lineHeight: 1.3, weight: 600 },
}

export const weights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
}

export function getTypographyVars() {
  const vars = {}
  for (const [key, val] of Object.entries(scale)) {
    vars[`--fs-${key}`] = val.size
    vars[`--lh-${key}`] = val.lineHeight
    vars[`--fw-${key}`] = val.weight
  }
  vars['--ff-body'] = typeface.body
  vars['--ff-mono'] = typeface.mono
  return vars
}
