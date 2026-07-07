import { useRef, useState } from 'react'
import gearSvg from '../assets/icons/gear.svg'

type SettingsPanelProps = {
  muted: boolean
  onToggleMuted: () => void
  onReset: () => void
  onExportSave: () => string
  onImportSave: (rawJson: string) => void
  onOpenEditor?: () => void
}

export function SettingsPanel({
  muted,
  onToggleMuted,
  onOpenEditor,
  onReset,
  onExportSave,
  onImportSave,
}: SettingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [message, setMessage] = useState('')

  const handleExport = () => {
    const saveJson = onExportSave()
    const blob = new Blob([saveJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `word-paws-save-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Save file exported.')
  }

  const handleImport = (file: File | undefined) => {
    if (!file) {
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      try {
        onImportSave(String(reader.result ?? ''))
        setMessage('Save file imported.')
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Could not import save file.')
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }

    reader.readAsText(file)
  }

  return (
    <details className="settings-panel">
      <summary>
        <img src={gearSvg} alt="Settings" className="gear-icon" />
      </summary>
      <div className="settings-content">
        <button type="button" onClick={onToggleMuted}>
          {muted ? 'Unmute sound' : 'Mute sound'}
        </button>
        <button type="button" onClick={handleExport}>
          Export save
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Import save
        </button>
        <input
          accept="application/json,.json"
          className="save-import-input"
          ref={fileInputRef}
          type="file"
          onChange={(event) => handleImport(event.currentTarget.files?.[0])}
        />
        {onOpenEditor && (
          <button type="button" onClick={onOpenEditor}>
            Level Editor
          </button>
        )}
        <button className="danger" type="button" onClick={onReset}>
          Reset progress
        </button>
        {message && <p className="settings-message">{message}</p>}
      </div>
    </details>
  )
}
