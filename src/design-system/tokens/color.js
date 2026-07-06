export const neutrals = {
  50: '#FAFAFA',
  100: '#F4F4F5',
  200: '#E4E4E7',
  300: '#D4D4D8',
  400: '#A1A1AA',
  500: '#71717A',
  600: '#52525B',
  700: '#3F3F46',
  800: '#27272A',
  900: '#18181B',
  950: '#09090B',
}

export const accents = {
  blue:    { 50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 300: '#93C5FD', 400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8', 800: '#1E40AF', 900: '#1E3A8A' },
  teal:    { 50: '#F0FDFA', 100: '#CCFBF1', 200: '#99F6E4', 300: '#5EEAD4', 400: '#2DD4BF', 500: '#14B8A6', 600: '#0D9488', 700: '#0F766E', 800: '#115E59', 900: '#134E4A' },
  green:   { 50: '#F0FDF4', 100: '#DCFCE7', 200: '#BBF7D0', 300: '#86EFAC', 400: '#4ADE80', 500: '#22C55E', 600: '#16A34A', 700: '#15803D', 800: '#166534', 900: '#14532D' },
  yellow:  { 50: '#FEFCE8', 100: '#FEF9C3', 200: '#FEF08A', 300: '#FDE047', 400: '#FACC15', 500: '#EAB308', 600: '#CA8A04', 700: '#A16207', 800: '#854D0E', 900: '#713F12' },
  orange:  { 50: '#FFF7ED', 100: '#FFEDD5', 200: '#FED7AA', 300: '#FDBA74', 400: '#FB923C', 500: '#F97316', 600: '#EA580C', 700: '#C2410C', 800: '#9A3412', 900: '#7C2D12' },
  red:     { 50: '#FEF2F2', 100: '#FEE2E2', 200: '#FECACA', 300: '#FCA5A5', 400: '#F87171', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C', 800: '#991B1B', 900: '#7F1D1D' },
  purple:  { 50: '#FAF5FF', 100: '#F3E8FF', 200: '#E9D5FF', 300: '#D8B4FE', 400: '#C084FC', 500: '#A855F7', 600: '#9333EA', 700: '#7E22CE', 800: '#6B21A8', 900: '#581C87' },
  pink:    { 50: '#FDF2F8', 100: '#FCE7F3', 200: '#FBCFE8', 300: '#F9A8D4', 400: '#F472B6', 500: '#EC4899', 600: '#DB2777', 700: '#BE185D', 800: '#9D174D', 900: '#831843' },
}

export const semantic = {
  bg:           neutrals[50],
  bgSecondary:  neutrals[100],
  surface:      '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border:       neutrals[200],
  borderStrong: neutrals[300],
  text:         neutrals[900],
  textSecondary: neutrals[600],
  textTertiary: neutrals[500],
  textInverse:  '#FFFFFF',

  primary:      accents.blue[600],
  primaryHover: accents.blue[700],
  primaryLight: accents.blue[100],
  primaryText:  '#FFFFFF',

  success:      accents.green[600],
  successLight: accents.green[100],
  warning:      accents.yellow[600],
  warningLight: accents.yellow[100],
  danger:       accents.red[600],
  dangerHover:  accents.red[700],
  dangerLight:  accents.red[100],

  focus:        accents.blue[500],
  selection:    accents.blue[200],

  overlay:      'rgba(0,0,0,0.4)',
  shadow:       'rgba(0,0,0,0.08)',
  shadowStrong: 'rgba(0,0,0,0.16)',
}

export const darkSemantic = {
  bg:           neutrals[950],
  bgSecondary:  neutrals[900],
  surface:      neutrals[900],
  surfaceElevated: neutrals[800],
  border:       neutrals[800],
  borderStrong: neutrals[700],
  text:         neutrals[50],
  textSecondary: neutrals[300],
  textTertiary: neutrals[400],
  textInverse:  neutrals[950],

  primary:      accents.blue[300],
  primaryHover: accents.blue[200],
  primaryLight: accents.blue[900],
  primaryText:  neutrals[950],

  success:      accents.green[300],
  successLight: accents.green[900],
  warning:      accents.yellow[300],
  warningLight: accents.yellow[900],
  danger:       accents.red[300],
  dangerHover:  accents.red[200],
  dangerLight:  accents.red[900],

  focus:        accents.blue[300],
  selection:    accents.blue[800],

  overlay:      'rgba(0,0,0,0.6)',
  shadow:       'rgba(0,0,0,0.3)',
  shadowStrong: 'rgba(0,0,0,0.5)',
}
