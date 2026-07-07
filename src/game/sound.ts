type SoundName = 'select' | 'correct' | 'bonus' | 'invalid' | 'hint' | 'complete'

export function playSound(name: SoundName, muted: boolean) {
  if (muted) {
    return
  }

  // Hook point for future audio assets. Keeping this side-effect tiny makes
  // sound optional for PWA/mobile wrappers and friendly to browser autoplay rules.
  window.dispatchEvent(new CustomEvent('word-paws-sound', { detail: name }))
}
