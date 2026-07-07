import { useState, useCallback } from 'react'
import { GameScreen } from './components/GameScreen'
import { LevelEditor } from './components/LevelEditor'
import { LevelSelect } from './components/LevelSelect'
import { SettingsPanel } from './components/SettingsPanel'
import { PACKS } from './data/packs/index.ts'
import type { LevelData, PlayerProgress } from './game/types'
import {
  exportProgress,
  importProgress,
  loadProgress,
  resetProgress,
  saveProgress,
} from './game/persistence'

function getLevelFromPacks(
  packId: string,
  levelIndex: number,
): { level: LevelData; packId: string; levelIndex: number } | null {
  const packDef = PACKS.find((p) => p.pack.id === packId)
  if (!packDef) return null
  const level = packDef.levels[levelIndex]
  if (!level) return null
  return { level, packId, levelIndex }
}

function getNextLevel(
  packId: string,
  levelIndex: number,
): { packId: string; levelIndex: number; level: LevelData } | null {
  const currentPackIdx = PACKS.findIndex((p) => p.pack.id === packId)
  if (currentPackIdx === -1) return null

  const currentPack = PACKS[currentPackIdx]

  if (levelIndex + 1 < currentPack.levels.length) {
    return { packId, levelIndex: levelIndex + 1, level: currentPack.levels[levelIndex + 1] }
  }

  const nextPack = PACKS[currentPackIdx + 1]
  if (nextPack) {
    return { packId: nextPack.pack.id, levelIndex: 0, level: nextPack.levels[0] }
  }

  return null
}

function getFirstLevel(): { packId: string; levelIndex: number; level: LevelData } | null {
  const firstPack = PACKS[0]
  if (!firstPack) return null
  return { packId: firstPack.pack.id, levelIndex: 0, level: firstPack.levels[0] }
}

function App() {
  const [progress, setProgressState] = useState<PlayerProgress>(() => loadProgress())
  const [screen, setScreen] = useState<'game' | 'levels'>('game')
  const [showEditor, setShowEditor] = useState(false)

  const resolved = getLevelFromPacks(progress.currentPackId, progress.currentLevelIndex) ?? getFirstLevel()
  const activeLevel = resolved?.level ?? null

  const setProgress = useCallback((recipe: (progress: PlayerProgress) => PlayerProgress) => {
    setProgressState((current) => {
      const next = recipe(current)
      saveProgress(next)
      return next
    })
  }, [])

  const startLevel = useCallback(
    (packId: string, levelIndex: number) => {
      setProgress((current) => ({
        ...current,
        currentPackId: packId,
        currentLevelIndex: levelIndex,
      }))
      setScreen('game')
    },
    [setProgress],
  )

  const handleReset = useCallback(() => {
    const next = resetProgress()
    setProgressState(next)
    setScreen('game')
  }, [])

  const handleExportSave = useCallback(() => exportProgress(progress), [progress])

  const handleImportSave = useCallback((rawJson: string) => {
    const next = importProgress(rawJson)
    saveProgress(next)
    setProgressState(next)
    setScreen('game')
  }, [])

  const handleLevelComplete = useCallback(
    (packId: string, _levelIndex: number) => {
      const packDef = PACKS.find((p) => p.pack.id === packId)
      if (!packDef) return

      const packCompletedCount = (progress.packsCompleted[packId] ?? 0) + 1

      const newPacksCompleted = {
        ...progress.packsCompleted,
        [packId]: Math.min(packCompletedCount, packDef.levels.length),
      }

      const newPacksUnlocked = { ...progress.packsUnlocked }
      const currentPackIdx = PACKS.findIndex((p) => p.pack.id === packId)
      if (currentPackIdx !== -1 && currentPackIdx + 1 < PACKS.length) {
        const nextPackId = PACKS[currentPackIdx + 1].pack.id
        if (newPacksCompleted[packId] === packDef.levels.length && !newPacksUnlocked[nextPackId]) {
          newPacksUnlocked[nextPackId] = true
        }
      }

      setProgress((current) => ({
        ...current,
        packsCompleted: newPacksCompleted,
        packsUnlocked: newPacksUnlocked,
      }))
    },
    [progress.packsCompleted, progress.packsUnlocked, setProgress],
  )

  const onNextLevel = useCallback(() => {
    if (!resolved) return
    const next = getNextLevel(resolved.packId, resolved.levelIndex)
    if (!next) return

    setProgress((current) => ({
      ...current,
      currentPackId: next.packId,
      currentLevelIndex: next.levelIndex,
    }))
  }, [resolved, setProgress])

  const onOpenLevels = useCallback(() => {
    setScreen('levels')
  }, [])

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
          muted={progress.settings.soundMuted}
          onExportSave={handleExportSave}
          onImportSave={handleImportSave}
          onOpenEditor={() => setShowEditor(true)}
          onReset={handleReset}
          onToggleMuted={() =>
            setProgress((current) => ({
              ...current,
              settings: {
                ...current.settings,
                soundMuted: !current.settings.soundMuted,
              },
            }))
          }
        />
      </header>

      {showEditor ? (
        <LevelEditor onClose={() => setShowEditor(false)} />
      ) : screen === 'levels' ? (
        <LevelSelect
          progress={progress}
          onSelectLevel={startLevel}
        />
      ) : activeLevel ? (
        <GameScreen
          level={activeLevel}
          packId={resolved!.packId}
          levelIndex={resolved!.levelIndex}
          onOpenLevels={onOpenLevels}
          onNextLevel={onNextLevel}
          onLevelComplete={handleLevelComplete}
          progress={progress}
          setProgress={setProgress}
        />
      ) : null}
    </div>
  )
}

export default App
