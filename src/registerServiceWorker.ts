export type UpdateReadyCallback = (registration: ServiceWorkerRegistration) => void

let onUpdateReady: UpdateReadyCallback | null = null

export function setOnUpdateReady(callback: UpdateReadyCallback | null) {
  onUpdateReady = callback
}

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/wordgames/sw.js', {
        scope: '/wordgames/',
      })

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing
        if (!installing) return

        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            onUpdateReady?.(registration)
          }
        })
      })
    } catch {
      // The game remains playable online if registration is unavailable.
    }
  })
}

export function skipWaiting(registration: ServiceWorkerRegistration) {
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
}
