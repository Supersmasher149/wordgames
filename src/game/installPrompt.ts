import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY = 'word-paws-install-dismissed'

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')
  const [installed, setInstalled] = useState(() =>
    window.matchMedia('(display-mode: standalone)').matches,
  )

  useEffect(() => {
    if (!import.meta.env.PROD) return

    const handler = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)

    const onInstalled = () => setInstalled(true)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async () => {
    if (!promptEvent) return

    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice

    setPromptEvent(null)

    if (outcome === 'accepted') {
      setInstalled(true)
    }

    if (outcome === 'dismissed') {
      setDismissed(true)
      localStorage.setItem(STORAGE_KEY, 'true')
    }
  }

  const dismiss = () => {
    setDismissed(true)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  const isInstallable = !installed && !dismissed && promptEvent !== null

  return { isInstallable, install, dismiss }
}
