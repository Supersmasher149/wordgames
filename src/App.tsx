import { useState } from 'react'
import { levels } from './data/levels'
import { GameScreen } from './components/GameScreen'
import { LevelSelect } from './components/LevelSelect'
import { SettingsPanel } from './components/SettingsPanel'
import type { PlayerProgress } from './game/types'
import { loadProgress, resetProgress, saveProgress } from './game/persistence'

function App() {
  const [progress, setProgressState] = useState<PlayerProgress>(() => loadProgress())
  const [screen, setScreen] = useState<'game' | 'levels'>('game')
  const [activeLevelId, setActiveLevelId] = useState(progress.currentLevelId)
  const activeLevel =
    levels.find((level) => level.id === activeLevelId) ?? levels[0]

  const setProgress = (recipe: (progress: PlayerProgress) => PlayerProgress) => {
    setProgressState((current) => {
      const next = recipe(current)
      saveProgress(next)
      return next
    })
  }

  const startLevel = (levelId: number) => {
    setActiveLevelId(levelId)
    setScreen('game')
    setProgress((current) => ({ ...current, currentLevelId: levelId }))
  }

  const handleReset = () => {
    const next = resetProgress()
    setProgressState(next)
    setActiveLevelId(next.currentLevelId)
    setScreen('game')
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="app-header">
        <button className="brand-button" type="button" onClick={() => setScreen('game')}>
          <span className="brand-mark">WG</span>
          <span>Word Grove</span>
        </button>
        <SettingsPanel
          muted={progress.muted}
          onReset={handleReset}
          onToggleMuted={() =>
            setProgress((current) => ({ ...current, muted: !current.muted }))
          }
        />
      </header>

      {screen === 'levels' ? (
        <LevelSelect
          completedLevelIds={progress.completedLevelIds}
          currentLevelId={progress.currentLevelId}
          levels={levels}
          onSelectLevel={startLevel}
        />
      ) : (
        <GameScreen
          level={activeLevel}
          onOpenLevels={() => setScreen('levels')}
          onStartLevel={startLevel}
          progress={progress}
          setProgress={setProgress}
        />
      )}
    </div>
  )
}

export default App
