import { useEffect, useMemo, useState } from 'react'
import type { Level, LevelData, PlayerProgress } from '../game/types'
import {
  evaluateSubmission,
  getHintCell,
  isLevelComplete,
  normalizeWord,
} from '../game/puzzleEngine'
import { getLevelProgress } from '../game/persistence'
import { playSound } from '../game/sound'
import { solveGrid } from '../engine/gridSolver.ts'
import { discoverAllValidBonusWords, deduplicateAndFilterBonuses } from '../game/bonusDiscovery.ts'
import { CrosswordGrid } from './CrosswordGrid'
import { LetterWheel } from './LetterWheel'
import { LevelCompleteModal } from './LevelCompleteModal'

type GameScreenProps = {
  level: LevelData
  packId: string
  levelIndex: number
  progress: PlayerProgress
  setProgress: (recipe: (progress: PlayerProgress) => PlayerProgress) => void
  onOpenLevels: () => void
  onNextLevel: () => void
  onLevelComplete: (packId: string, levelIndex: number) => void
}

type Feedback = {
  id: number
  status: 'idle' | 'success' | 'bonus' | 'error'
  message: string
}

function buildLevelFromData(levelData: LevelData): Level | null {
  const placements = solveGrid(levelData.letters, levelData.requiredWords)
  if (!placements) return null

  const bonusCandidates = discoverAllValidBonusWords(levelData.letters)
  const bonusWords = deduplicateAndFilterBonuses(
    new Set(levelData.requiredWords),
    bonusCandidates,
  )

  return {
    id: levelData.id,
    title: levelData.title,
    letters: [...levelData.letters],
    words: placements,
    bonusWords,
  }
}

export function GameScreen({
  level,
  packId,
  levelIndex,
  progress,
  setProgress,
  onOpenLevels,
  onNextLevel,
  onLevelComplete,
}: GameScreenProps) {
  const solvedLevel = useMemo(() => buildLevelFromData(level), [level])
  const [wheelLetters, setWheelLetters] = useState(level.letters)
  const [selectedWord, setSelectedWord] = useState('')
  const [feedback, setFeedback] = useState<Feedback>({
    id: 0,
    status: 'idle',
    message: 'Find every word in the grid.',
  })
  const [recentWord, setRecentWord] = useState<string | null>(null)
  const [showComplete, setShowComplete] = useState(false)

  useEffect(() => {
    setWheelLetters(level.letters)
    setSelectedWord('')
    setRecentWord(null)
    setFeedback((current) => ({
      id: current.id + 1,
      status: 'idle',
      message: 'Find every word in the grid.',
    }))
    setShowComplete(false)
  }, [level])

  if (!solvedLevel) return null

  const levelProgress = getLevelProgress(progress, level.id)
  const foundCount = levelProgress.foundWords.length

  const showFeedback = (status: Feedback['status'], message: string) => {
    setFeedback((current) => ({ id: current.id + 1, status, message }))
  }

  const submitWord = (rawWord: string) => {
    const result = evaluateSubmission(solvedLevel, levelProgress, rawWord)

    if (result.kind === 'required') {
      const updatedLevelProgress = {
        ...levelProgress,
        foundWords: [...levelProgress.foundWords, result.word],
      }
      const completed = isLevelComplete(solvedLevel, updatedLevelProgress)

      setProgress((current) => {
        let unlockedIds = current.unlockedLevelIds
        let completedIds = current.completedLevelIds

        if (completed && !current.completedLevelIds.includes(level.id)) {
          completedIds = [...current.completedLevelIds, level.id]
          const nextId = level.id + 1
          if (!current.unlockedLevelIds.includes(nextId)) {
            unlockedIds = [...current.unlockedLevelIds, nextId]
          }
        }

        return {
          ...current,
          coins: current.coins + (completed ? 25 : 5),
          unlockedLevelIds: unlockedIds,
          completedLevelIds: completedIds,
          levels: {
            ...current.levels,
            [level.id]: updatedLevelProgress,
          },
        }
      })

      setRecentWord(result.word)
      window.setTimeout(() => {
        setRecentWord((current) => (current === result.word ? null : current))
      }, 950)
      showFeedback('success', `${result.word} fills the grid.`)
      playSound(completed ? 'complete' : 'correct', progress.settings.soundMuted)

      if (completed) {
        onLevelComplete(packId, levelIndex)
        window.setTimeout(() => setShowComplete(true), 450)
      }

      return
    }

    if (result.kind === 'bonus') {
      setProgress((current) => ({
        ...current,
        coins: current.coins + result.coins,
        levels: {
          ...current.levels,
          [level.id]: {
            ...levelProgress,
            foundBonusWords: [...levelProgress.foundBonusWords, result.word],
          },
        },
      }))
      showFeedback('bonus', `${result.word} is a bonus word: +${result.coins} coins.`)
      playSound('bonus', progress.settings.soundMuted)
      return
    }

    showFeedback(
      'error',
      result.kind === 'duplicate'
        ? `${result.word} was already found. Try a new word.`
        : `${result.word || 'That'} is not in this puzzle.`,
    )
    playSound('invalid', progress.settings.soundMuted)
  }

  const shuffleLetters = () => {
    setWheelLetters((current) => {
      const shuffled = [...current]

      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1))
        ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
      }

      return shuffled
    })
  }

  const HINT_COST = 10

  const revealHint = () => {
    if (progress.coins < HINT_COST) {
      showFeedback('error', `Need ${HINT_COST} coins for a hint. Complete words to earn more.`)
      return
    }

    const hint = getHintCell(solvedLevel, levelProgress)

    if (!hint) {
      showFeedback('idle', 'Every visible clue is already revealed.')
      return
    }

    setProgress((current) => ({
      ...current,
      usedHints: current.usedHints + 1,
      coins: current.coins - HINT_COST,
      levels: {
        ...current.levels,
        [level.id]: {
          ...levelProgress,
          revealedCells: [...levelProgress.revealedCells, hint],
        },
      },
    }))
    showFeedback('success', 'A hidden letter catches the light.')
    playSound('hint', progress.settings.soundMuted)
  }

  return (
    <main className="game-screen">
      <section className="game-topbar">
        <button type="button" onClick={onOpenLevels}>
          Levels
        </button>
        <div>
          <p className="eyebrow">Level {level.id}</p>
          <h1>{level.title}</h1>
        </div>
        <div className="coin-pill">{progress.coins} coins</div>
      </section>

      <section className="game-board">
        <div className="progress-strip">
          <span>
            {foundCount}/{solvedLevel.words.length} words
          </span>
          <span>{levelProgress.foundBonusWords.length} bonus</span>
          <span>{progress.usedHints} hints used</span>
        </div>

        <CrosswordGrid level={solvedLevel} progress={levelProgress} recentWord={recentWord} />

        <div className={`feedback ${feedback.status}`} aria-live="polite">
          <strong>{selectedWord ? normalizeWord(selectedWord) : feedback.message}</strong>
        </div>

        <div className="power-actions">
          <button type="button" onClick={shuffleLetters}>
            Shuffle
          </button>
          <button type="button" onClick={revealHint}>
            Hint
          </button>
        </div>

        <LetterWheel
          letters={wheelLetters}
          animationKey={feedback.id}
          onSubmit={submitWord}
          onWordChange={setSelectedWord}
          status={feedback.status}
        />
      </section>

      {showComplete && (
        <LevelCompleteModal
          coins={progress.coins}
          hasNextLevel={true}
          onLevels={onOpenLevels}
          onNext={onNextLevel}
          title={level.title}
        />
      )}
    </main>
  )
}
