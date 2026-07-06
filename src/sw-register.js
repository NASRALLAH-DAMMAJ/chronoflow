const SW_PATH = '/sw.js'

const dispatchEvent = (detail) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('sw-update-available', { detail }))
}

export async function registerSW() {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH)

    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing
      if (!installingWorker) return

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            dispatchEvent({
              registration,
              applyUpdate: () => {
                installingWorker.postMessage({ type: 'SKIP_WAITING' })
              },
            })
          }
        }
      })
    })

    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })

    return registration
  } catch (err) {
    console.error('[SW] Registration failed:', err)
    return null
  }
}
