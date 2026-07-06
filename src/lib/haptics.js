const THROTTLE_MS = 100
let lastVibrateTime = 0

function canVibrate() {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator
}

function throttledVibrate(pattern) {
  if (!canVibrate()) return
  const now = Date.now()
  if (now - lastVibrateTime < THROTTLE_MS) return
  lastVibrateTime = now
  navigator.vibrate(pattern)
}

export function hapticLight() {
  throttledVibrate(10)
}

export function hapticMedium() {
  throttledVibrate(20)
}

export function hapticHeavy() {
  throttledVibrate(40)
}

export function hapticError() {
  throttledVibrate([30, 50, 30])
}

export function hapticSuccess() {
  throttledVibrate([10, 30, 10])
}

export function haptic(style = 'light') {
  switch (style) {
    case 'light': hapticLight(); break
    case 'medium': hapticMedium(); break
    case 'heavy': hapticHeavy(); break
    case 'error': hapticError(); break
    case 'success': hapticSuccess(); break
    default: hapticLight(); break
  }
}
