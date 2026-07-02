export const radius = {
  none: '0px',
  sm:   '4px',
  md:   '6px',
  lg:   '8px',
  xl:   '12px',
  full: '9999px',
}

export const shadows = {
  card:  '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
  modal: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  overlay: '0 25px 50px -12px rgba(0,0,0,0.25)',
}

export const darkShadows = {
  card:  '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
  modal: '0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -4px rgba(0,0,0,0.3)',
  overlay: '0 25px 50px -12px rgba(0,0,0,0.6)',
}

export const surfaceMap = {
  card:     { bg: 'surface',       shadow: 'card' },
  modal:    { bg: 'surfaceElevated', shadow: 'modal' },
  overlay:  { bg: 'overlay',      shadow: 'overlay' },
  dropdown: { bg: 'surfaceElevated', shadow: 'modal' },
  tooltip:  { bg: 'surfaceElevated', shadow: 'modal' },
}
