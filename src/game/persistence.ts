import { levels } from '../data/levels'
import type { LevelProgress, PlayerProgress } from './types'
import { createEmptyLevelProgress, normalizeWord } from './puzzleEngine'

const STORAGE_KEY = 'word-grove-progress-v1'
export const SAVE_DATA_VERSION = 1

export function createDefaultProgress(): PlayerProgress {
  const firstLevelId = levels[0]?.id ?? 1

  return {
    version: SAVE_DATA_VERSION,
    currentLevelId: firstLevelId,
    unlockedLevelIds: [firstLevelId],
    completedLevelIds: [],
    coins: 0,
    usedHints: 0,
    settings: { soundMuted: false },
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

export function exportProgress(progress: PlayerProgress) {
  return JSON.stringify(sanitizeProgress(progress), null, 2)
}

export function importProgress(rawJson: string) {
  const parsed = JSON.parse(rawJson)

  if (!isRecord(parsed)) {
    throw new Error('Save file must be a JSON object.')
  }

  if (Number(parsed.version ?? SAVE_DATA_VERSION) > SAVE_DATA_VERSION) {
    throw new Error('Save file is from a newer version of Word Grove.')
  }

  return sanitizeProgress(parsed)
}

export function resetProgress() {
  window.localStorage.removeItem(STORAGE_KEY)
  return createDefaultProgress()
}

function sanitizeProgress(rawProgress: unknown): PlayerProgress {
  const defaults = createDefaultProgress()
  const raw = isRecord(rawProgress) ? rawProgress : {}
  const validLevelIds = new Set(levels.map((level) => level.id))
  const completedLevelIds = uniqueNumbers(raw.completedLevelIds).filter((levelId) =>
    validLevelIds.has(levelId),
  )
  const currentLevelId = validLevelIds.has(Number(raw.currentLevelId))
    ? Number(raw.currentLevelId)
    : defaults.currentLevelId
  const unlockedLevelIds = sanitizeUnlockedLevelIds(
    raw.unlockedLevelIds,
    completedLevelIds,
    currentLevelId,
  )

  return {
    version: SAVE_DATA_VERSION,
    currentLevelId,
    unlockedLevelIds,
    completedLevelIds,
    coins: nonNegativeNumber(raw.coins),
    usedHints: nonNegativeNumber(raw.usedHints),
    settings: sanitizeSettings(raw),
    levels: sanitizeLevelProgress(raw.levels),
  }
}

function sanitizeLevelProgress(rawLevels: unknown): PlayerProgress['levels'] {
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
    const levelProgress = isRecord(rawLevelProgress)
      ? rawLevelProgress
      : createEmptyLevelProgress()

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

function sanitizeUnlockedLevelIds(
  rawUnlockedLevelIds: unknown,
  completedLevelIds: number[],
  currentLevelId: number,
) {
  const validLevelIds = new Set(levels.map((level) => level.id))
  const derivedUnlockedIds = deriveUnlockedLevelIds(completedLevelIds)
  const rawUnlockedIds = uniqueNumbers(rawUnlockedLevelIds).filter((levelId) =>
    validLevelIds.has(levelId),
  )
  const unlockedIds = new Set([...derivedUnlockedIds, ...rawUnlockedIds, currentLevelId])

  return levels
    .map((level) => level.id)
    .filter((levelId) => unlockedIds.has(levelId))
}

function deriveUnlockedLevelIds(completedLevelIds: number[]) {
  const unlockedIds = new Set<number>()

  if (levels[0]) {
    unlockedIds.add(levels[0].id)
  }

  levels.forEach((level, index) => {
    if (completedLevelIds.includes(level.id) && levels[index + 1]) {
      unlockedIds.add(levels[index + 1].id)
    }
  })

  return [...unlockedIds]
}

function sanitizeSettings(rawProgress: Record<string, unknown>) {
  const rawSettings = isRecord(rawProgress.settings) ? rawProgress.settings : {}

  return {
    soundMuted: Boolean(rawSettings.soundMuted ?? rawProgress.muted),
  }
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
