export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/wordgames/sw.js', { scope: '/wordgames/' }).catch(() => {
      // The game remains playable online if registration is unavailable.
    })
  })
}
