import { levels } from '../data/levels'
import type { LevelProgress, PlayerProgress } from './types'
import { createEmptyLevelProgress, normalizeWord } from './puzzleEngine'

const STORAGE_KEY = 'word-grove-progress-v1'

export function createDefaultProgress(): PlayerProgress {
  return {
    currentLevelId: levels[0]?.id ?? 1,
    completedLevelIds: [],
    coins: 0,
    usedHints: 0,
    muted: false,
    levels: {},
  }
}

export function getLevelProgress(
  progress: PlayerProgress,
  levelId: number,
): LevelProgress {
  return progress.levels[levelId] ?? createEmptyLevelProgress()
}

export function loadProgress(): PlayerProgress {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)

    if (!saved) {
      return createDefaultProgress()
    }

    return sanitizeProgress(JSON.parse(saved))
  } catch {
    return createDefaultProgress()
  }
}

export function saveProgress(progress: PlayerProgress) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeProgress(progress)))
}

export function resetProgress() {
  window.localStorage.removeItem(STORAGE_KEY)
  return createDefaultProgress()
}

function sanitizeProgress(rawProgress: Partial<PlayerProgress>): PlayerProgress {
  const defaults = createDefaultProgress()
  const validLevelIds = new Set(levels.map((level) => level.id))
  const currentLevelId = validLevelIds.has(Number(rawProgress.currentLevelId))
    ? Number(rawProgress.currentLevelId)
    : defaults.currentLevelId

  return {
    currentLevelId,
    completedLevelIds: uniqueNumbers(rawProgress.completedLevelIds).filter((levelId) =>
      validLevelIds.has(levelId),
    ),
    coins: nonNegativeNumber(rawProgress.coins),
    usedHints: nonNegativeNumber(rawProgress.usedHints),
    muted: Boolean(rawProgress.muted),
    levels: sanitizeLevelProgress(rawProgress.levels),
  }
}

function sanitizeLevelProgress(
  rawLevels: Partial<PlayerProgress>['levels'],
): PlayerProgress['levels'] {
  const sanitizedLevels: PlayerProgress['levels'] = {}

  if (!rawLevels || typeof rawLevels !== 'object') {
    return sanitizedLevels
  }

  for (const [levelId, rawLevelProgress] of Object.entries(rawLevels)) {
    const level = levels.find((candidate) => candidate.id === Number(levelId))

    if (!level) {
      continue
    }

    const requiredWords = new Set(level.words.map((placement) => normalizeWord(placement.word)))
    const bonusWords = new Set(level.bonusWords.map(normalizeWord))
    const levelProgress = rawLevelProgress ?? createEmptyLevelProgress()

    sanitizedLevels[level.id] = {
      foundWords: uniqueWords(levelProgress.foundWords).filter((word) =>
        requiredWords.has(word),
      ),
      foundBonusWords: uniqueWords(levelProgress.foundBonusWords).filter((word) =>
        bonusWords.has(word),
      ),
      revealedCells: Array.isArray(levelProgress.revealedCells)
        ? levelProgress.revealedCells.filter(
            (cell) =>
              Number.isInteger(cell.row) &&
              cell.row >= 0 &&
              Number.isInteger(cell.col) &&
              cell.col >= 0,
          )
        : [],
    }
  }

  return sanitizedLevels
}

function uniqueWords(words: unknown) {
  return Array.isArray(words) ? [...new Set(words.map(String).map(normalizeWord))] : []
}

function uniqueNumbers(numbers: unknown) {
  return Array.isArray(numbers)
    ? [...new Set(numbers.map(Number).filter((number) => Number.isInteger(number)))]
    : []
}

function nonNegativeNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}
