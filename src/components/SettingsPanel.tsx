type SettingsPanelProps = {
  muted: boolean
  onToggleMuted: () => void
  onReset: () => void
}

export function SettingsPanel({
  muted,
  onToggleMuted,
  onReset,
}: SettingsPanelProps) {
  return (
    <details className="settings-panel">
      <summary>Settings</summary>
      <div className="settings-content">
        <button type="button" onClick={onToggleMuted}>
          {muted ? 'Unmute sound' : 'Mute sound'}
        </button>
        <button className="danger" type="button" onClick={onReset}>
          Reset progress
        </button>
      </div>
    </details>
  )
}
