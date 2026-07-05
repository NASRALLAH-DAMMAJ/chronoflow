export function getTodayStr(date) {
  const d = date || new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const HOURS = 24
export const MINUTES_IN_DAY = 1440
export const HALF_DAY = MINUTES_IN_DAY / 2
export const DEG_PER_MINUTE = 360 / MINUTES_IN_DAY
export const RAD_PER_MINUTE = (2 * Math.PI) / MINUTES_IN_DAY
export const SNAP_MINUTES = 15
export const MS_PER_DAY = 86400000
export const LOCALE = 'en-US'

export const BLOCK_CATEGORIES = [
  'work', 'sleep', 'exercise', 'meal', 'leisure',
  'family', 'commute', 'chores', 'self-care', 'other',
]

export const CATEGORY_COLORS = {
  work:      '#60A5FA',
  sleep:     '#A78BFA',
  exercise:  '#4ADE80',
  meal:      '#FBBF24',
  leisure:   '#F472B6',
  family:    '#2DD4BF',
  commute:   '#FB923C',
  chores:    '#D4D4D8',
  'self-care': '#22D3EE',
  other:     '#A8A29E',
}

export const SLEEP_CATEGORY = 'sleep'
export const DEFAULT_CATEGORY = 'other'
export const DEFAULT_BLOCK_CATEGORY = BLOCK_CATEGORIES[0]

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SETTINGS: '/settings',
  RULES: '/settings/rules',
  ANALYTICS: '/analytics',
  ARCHIVE: '/archive',
}

export const LS_KEYS = {
  ONBOARDED: 'cf-onboarded',
  COMPLETED: 'cf-completed',
  THEME: 'cf-theme',
  MIGRATED: 'cf-migrated',
  BLOCKS_PREFIX: 'cf-blocks-',
}

export const EDGE_FUNCTIONS = {
  SCHEDULE: 'generate-schedule',
}

export const TABLES = {
  BLOCKS: 'blocks',
  RULES: 'recurring_rules',
  SETTINGS: 'settings',
}

export const SUPABASE_ERROR_NO_ROWS = 'PGRST116'

export const THEME_OPTIONS = ['system', 'light', 'dark']

export const DEFAULT_BEDTIME = 23 * 60
export const DEFAULT_WAKE = 7 * 60

export const DEFAULT_RULE_START = 8 * 60
export const DEFAULT_RULE_DURATION = 60

export const DIAL = {
  INNER_RADIUS_RATIO: 0.55,
  CANVAS_PADDING: 20,
  DEFAULT_SIZE: 380,
  FONT_FAMILY: 'Inter, sans-serif',
  EDGE_THRESHOLD: 0.12,
  LABEL_MAX_LENGTH: 14,
  LABEL_TRUNCATE_LENGTH: 10,
  BAR_HEIGHT: 4,
}

export const BRAND_COLOR = '#6366F1'
export const NO_CATEGORY = 'none'
