import { MINUTES_IN_DAY, CATEGORY_COLORS } from '../store/constants'

export function validateBlockLabel(label) {
  if (!label || typeof label !== 'string') return 'Label is required'
  const trimmed = label.trim()
  if (trimmed.length === 0) return 'Label cannot be empty'
  if (trimmed.length > 100) return 'Label must be 100 characters or less'
  return null
}

export function validateBlockCategory(category) {
  if (!category) return 'Category is required'
  if (!(category in CATEGORY_COLORS)) return `Invalid category: ${category}`
  return null
}

export function validateBlockTime(start, end) {
  if (typeof start !== 'number' || typeof end !== 'number') return 'Start and end must be numbers'
  if (start < 0 || start >= MINUTES_IN_DAY) return `Start must be 0–${MINUTES_IN_DAY - 1}`
  if (end < 0 || end > MINUTES_IN_DAY) return `End must be 0–${MINUTES_IN_DAY}`
  if (start === end) return 'Block must have a duration'
  return null
}

export function validateSleepTime(start, end) {
  if (typeof start !== 'number' || typeof end !== 'number') return 'Start and end must be numbers'
  if (start < 0 || start >= MINUTES_IN_DAY) return `Start must be 0–${MINUTES_IN_DAY - 1}`
  if (end < 0 || end >= MINUTES_IN_DAY) return `End must be 0–${MINUTES_IN_DAY - 1}`
  return null
}

export function validateRuleLabel(label) {
  if (!label || typeof label !== 'string') return 'Label is required'
  const trimmed = label.trim()
  if (trimmed.length === 0) return 'Label cannot be empty'
  if (trimmed.length > 100) return 'Label must be 100 characters or less'
  return null
}

export function validateRuleDays(days) {
  if (!Array.isArray(days) || days.length === 0) return 'Select at least one day'
  if (days.some(d => d < 0 || d > 6)) return 'Days must be 0–6 (Sun–Sat)'
  return null
}

export function validateRuleTime(startMin, duration) {
  if (typeof startMin !== 'number' || typeof duration !== 'number') return 'Time values required'
  if (startMin < 0 || startMin >= MINUTES_IN_DAY) return `Start must be 0–${MINUTES_IN_DAY - 1}`
  if (duration <= 0 || duration > MINUTES_IN_DAY) return `Duration must be 1–${MINUTES_IN_DAY}`
  return null
}

export function validateBlock(block) {
  return validateBlockLabel(block.label)
    || validateBlockCategory(block.category)
    || validateBlockTime(block.start, block.end)
}

export function validateSettings(settings) {
  if (settings.sleepStart != null && settings.sleepEnd != null) {
    return validateSleepTime(settings.sleepStart, settings.sleepEnd)
  }
  return null
}
