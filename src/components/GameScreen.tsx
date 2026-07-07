import { useEffect, useState } from 'react'
import { levels } from '../data/levels'
import type { Level, PlayerProgress } from '../game/types'
import {
  evaluateSubmission,
  getHintCell,
  isLevelComplete,
  normalizeWord,
} from '../game/puzzleEngine'
import { getLevelProgress } from '../game/persistence'
import { playSound } from '../game/sound'
import { CrosswordGrid } from './CrosswordGrid'
import { LetterWheel } from './LetterWheel'
import { LevelCompleteModal } from './LevelCompleteModal'

type GameScreenProps = {
  level: Level
  progress: PlayerProgress
  setProgress: (recipe: (progress: PlayerProgress) => PlayerProgress) => void
  onOpenLevels: () => void
  onStartLevel: (levelId: number) => void
}

type Feedback = {
  status: 'idle' | 'success' | 'bonus' | 'error'
  message: string
}

export function GameScreen({
  level,
  progress,
  setProgress,
  onOpenLevels,
  onStartLevel,
}: GameScreenProps) {
  const [wheelLetters, setWheelLetters] = useState(level.letters)
  const [selectedWord, setSelectedWord] = useState('')
  const [feedback, setFeedback] = useState<Feedback>({
    status: 'idle',
    message: 'Find every word in the grid.',
  })
  const [showComplete, setShowComplete] = useState(false)
  const levelProgress = getLevelProgress(progress, level.id)
  const foundCount = levelProgress.foundWords.length
  const nextLevel = levels.find((candidate) => candidate.id === level.id + 1)

  useEffect(() => {
    setWheelLetters(level.letters)
    setSelectedWord('')
    setFeedback({ status: 'idle', message: 'Find every word in the grid.' })
    setShowComplete(false)
  }, [level])

  const submitWord = (rawWord: string) => {
    const result = evaluateSubmission(level, levelProgress, rawWord)

    if (result.kind === 'required') {
      const updatedLevelProgress = {
        ...levelProgress,
        foundWords: [...levelProgress.foundWords, result.word],
      }
      const completed = isLevelComplete(level, updatedLevelProgress)

      setProgress((current) => ({
        ...current,
        coins: current.coins + (completed ? 25 : 5),
        completedLevelIds:
          completed && !current.completedLevelIds.includes(level.id)
            ? [...current.completedLevelIds, level.id]
            : current.completedLevelIds,
        levels: {
          ...current.levels,
          [level.id]: updatedLevelProgress,
        },
      }))

      setFeedback({ status: 'success', message: `${result.word} fills the grid.` })
      playSound(completed ? 'complete' : 'correct', progress.muted)

      if (completed) {
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
      setFeedback({ status: 'bonus', message: `Bonus word: +${result.coins} coins.` })
      playSound('bonus', progress.muted)
      return
    }

    setFeedback({
      status: 'error',
      message: result.kind === 'duplicate' ? 'Already found.' : 'Not in this puzzle.',
    })
    playSound('invalid', progress.muted)
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

  const revealHint = () => {
    const hint = getHintCell(level, levelProgress)

    if (!hint) {
      setFeedback({ status: 'idle', message: 'Every visible clue is already revealed.' })
      return
    }

    setProgress((current) => ({
      ...current,
      usedHints: current.usedHints + 1,
      levels: {
        ...current.levels,
        [level.id]: {
          ...levelProgress,
          revealedCells: [...levelProgress.revealedCells, hint],
        },
      },
    }))
    setFeedback({ status: 'success', message: 'A hidden letter catches the light.' })
    playSound('hint', progress.muted)
  }

  const goToNextLevel = () => {
    if (!nextLevel) {
      return
    }

    setProgress((current) => ({ ...current, currentLevelId: nextLevel.id }))
    onStartLevel(nextLevel.id)
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
            {foundCount}/{level.words.length} words
          </span>
          <span>{levelProgress.foundBonusWords.length} bonus</span>
          <span>{progress.usedHints} hints used</span>
        </div>

        <CrosswordGrid level={level} progress={levelProgress} />

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
          onSubmit={submitWord}
          onWordChange={setSelectedWord}
          status={feedback.status}
        />
      </section>

      {showComplete && (
        <LevelCompleteModal
          coins={progress.coins}
          hasNextLevel={Boolean(nextLevel)}
          onLevels={onOpenLevels}
          onNext={goToNextLevel}
          title={level.title}
        />
      )}
    </main>
  )
}
