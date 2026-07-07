import type { LevelProgress, PlayerProgress } from './types.ts'
import { createEmptyLevelProgress, normalizeWord } from './puzzleEngine.ts'
import { PACKS } from '../data/packs/index.ts'

const STORAGE_KEY = 'word-grove-progress-v2'
export const SAVE_DATA_VERSION = 2

const allLevelIds: number[] = []
const levelIdToPack: Map<number, { packId: string; index: number }> = new Map()
for (const packDef of PACKS) {
  for (let i = 0; i < packDef.levels.length; i++) {
    const id = packDef.levels[i].id
    allLevelIds.push(id)
    levelIdToPack.set(id, { packId: packDef.pack.id, index: i })
  }
}

function getFirstLevelId(): number {
  return PACKS[0]?.levels[0]?.id ?? 1
}

function getFirstPackId(): string {
  return PACKS[0]?.pack.id ?? ''
}

export function createDefaultProgress(): PlayerProgress {
  const firstId = getFirstLevelId()

  return {
    version: SAVE_DATA_VERSION,
    currentLevelId: firstId,
    unlockedLevelIds: [firstId],
    completedLevelIds: [],
    currentPackId: getFirstPackId(),
    currentLevelIndex: 0,
    packsUnlocked: { [getFirstPackId()]: true },
    packsCompleted: {},
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
      const migrated = migrateV1()
      if (migrated) return migrated
      return createDefaultProgress()
    }

    return sanitizeProgress(JSON.parse(saved))
  } catch {
    return createDefaultProgress()
  }
}

function migrateV1(): PlayerProgress | null {
  try {
    const v1Raw = window.localStorage.getItem('word-grove-progress-v1')
    if (!v1Raw) return null

    const v1 = JSON.parse(v1Raw)
    const defaults = createDefaultProgress()
    const raw = typeof v1 === 'object' && v1 !== null ? v1 : {}

    const completedLevelIds = uniqueNumbers(raw.completedLevelIds)
    const currentLevelIdVal = validLevelId(Number(raw.currentLevelId))

    const packsCompleted: Record<string, number> = {}
    for (const packDef of PACKS) {
      let count = 0
      for (const level of packDef.levels) {
        if (completedLevelIds.includes(level.id)) count++
      }
      packsCompleted[packDef.pack.id] = count
    }

    const packsUnlocked: Record<string, boolean> = {}
    for (let i = 0; i < PACKS.length; i++) {
      if (i === 0) {
        packsUnlocked[PACKS[i].pack.id] = true
      } else if (packsCompleted[PACKS[i - 1].pack.id] === PACKS[i - 1].levels.length) {
        packsUnlocked[PACKS[i].pack.id] = true
      }
    }

    let currentPackId = defaults.currentPackId
    let currentLevelIndex = 0
    let currentLevelIdFlat = currentLevelIdVal

    if (currentLevelIdVal !== 0) {
      const mapping = levelIdToPack.get(currentLevelIdVal)
      if (mapping) {
        currentPackId = mapping.packId
        currentLevelIndex = mapping.index
        currentLevelIdFlat = currentLevelIdVal
      }
    }

    const unlockedLevelIds = sanitizeV1Unlocked(raw.unlockedLevelIds, completedLevelIds, currentLevelIdVal)

    const progress: PlayerProgress = {
      version: SAVE_DATA_VERSION,
      currentLevelId: currentLevelIdFlat,
      unlockedLevelIds,
      completedLevelIds,
      currentPackId,
      currentLevelIndex,
      packsUnlocked,
      packsCompleted,
      coins: nonNegativeNumber(raw.coins),
      usedHints: nonNegativeNumber(raw.usedHints),
      settings: sanitizeSettings(raw),
      levels: sanitizeV1Levels(raw.levels, completedLevelIds),
    }

    window.localStorage.removeItem('word-grove-progress-v1')
    return progress
  } catch {
    return null
  }
}

function sanitizeV1Unlocked(
  rawUnlocked: unknown,
  completedLevelIds: number[],
  currentLevelId: number,
): number[] {
  const rawIds = uniqueNumbers(rawUnlocked)
  const derived = deriveV1Unlocked(completedLevelIds)
  const unlocked = new Set([...derived, ...rawIds, currentLevelId])
  return allLevelIds.filter((id) => unlocked.has(id))
}

function deriveV1Unlocked(completedLevelIds: number[]): number[] {
  const result: number[] = []
  if (allLevelIds.length > 0) result.push(allLevelIds[0])
  for (let i = 0; i < allLevelIds.length - 1; i++) {
    if (completedLevelIds.includes(allLevelIds[i])) {
      result.push(allLevelIds[i + 1])
    }
  }
  return result
}

function sanitizeV1Levels(
  rawLevels: unknown,
  _completedLevelIds: number[],
): PlayerProgress['levels'] {
  const sanitized: PlayerProgress['levels'] = {}

  if (!rawLevels || typeof rawLevels !== 'object') return sanitized

  for (const [levelIdStr, rawLevelProgress] of Object.entries(rawLevels)) {
    const levelId = Number(levelIdStr)
    const mapping = levelIdToPack.get(levelId)
    if (!mapping) continue

    const packDef = PACKS.find((p) => p.pack.id === mapping.packId)
    if (!packDef) continue

    const levelData = packDef.levels[mapping.index]
    const requiredWords = new Set(levelData.requiredWords.map(normalizeWord))
    const levelProgress = isRecord(rawLevelProgress) ? rawLevelProgress : createEmptyLevelProgress()

    sanitized[levelId] = {
      foundWords: uniqueWords(levelProgress.foundWords).filter((word) =>
        requiredWords.has(word),
      ),
      foundBonusWords: uniqueWords(levelProgress.foundBonusWords),
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

  return sanitized
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
  window.localStorage.removeItem('word-grove-progress-v1')
  return createDefaultProgress()
}

function sanitizeProgress(rawProgress: unknown): PlayerProgress {
  const defaults = createDefaultProgress()
  const raw = isRecord(rawProgress) ? rawProgress : {}

  if (Number(raw.version ?? 0) < 2) {
    const migrated = migrateV1()
    return migrated ?? defaults
  }

  const completedLevelIds = uniqueNumbers(raw.completedLevelIds).filter((id) =>
    levelIdToPack.has(id),
  )

  const currentLevelId = validLevelId(Number(raw.currentLevelId))

  const packsCompleted: Record<string, number> = {}
  const rawPacksCompleted = isRecord(raw.packsCompleted) ? raw.packsCompleted : {}
  for (const packDef of PACKS) {
    const stored = Number(rawPacksCompleted[packDef.pack.id])
    packsCompleted[packDef.pack.id] = Number.isFinite(stored) ? Math.max(0, stored) : 0
  }

  const packsUnlocked: Record<string, boolean> = {}
  const rawPacksUnlocked = isRecord(raw.packsUnlocked) ? raw.packsUnlocked : {}
  for (let i = 0; i < PACKS.length; i++) {
    if (i === 0 || rawPacksUnlocked[PACKS[i].pack.id] === true || packsCompleted[PACKS[i - 1].pack.id] === PACKS[i - 1].levels.length) {
      packsUnlocked[PACKS[i].pack.id] = true
    }
  }

  let currentPackId = defaults.currentPackId
  let currentLevelIndex = 0
  if (typeof raw.currentPackId === 'string' && PACKS.some((p) => p.pack.id === raw.currentPackId)) {
    currentPackId = raw.currentPackId
  }
  if (Number.isInteger(Number(raw.currentLevelIndex))) {
    currentLevelIndex = Math.max(0, Number(raw.currentLevelIndex))
  }

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
    currentPackId,
    currentLevelIndex,
    packsUnlocked,
    packsCompleted,
    coins: nonNegativeNumber(raw.coins),
    usedHints: nonNegativeNumber(raw.usedHints),
    settings: sanitizeSettings(raw),
    levels: sanitizeLevelProgress(raw.levels),
  }
}

function validLevelId(value: number): number {
  return levelIdToPack.has(value) ? value : getFirstLevelId()
}

function sanitizeLevelProgress(rawLevels: unknown): PlayerProgress['levels'] {
  const sanitized: PlayerProgress['levels'] = {}

  if (!rawLevels || typeof rawLevels !== 'object') return sanitized

  for (const [levelIdStr, rawLevelProgress] of Object.entries(rawLevels)) {
    const levelId = Number(levelIdStr)
    const mapping = levelIdToPack.get(levelId)
    if (!mapping) continue

    const packDef = PACKS.find((p) => p.pack.id === mapping.packId)
    if (!packDef) continue

    const levelData = packDef.levels[mapping.index]
    const requiredWords = new Set(levelData.requiredWords.map(normalizeWord))
    const levelProgress = isRecord(rawLevelProgress) ? rawLevelProgress : createEmptyLevelProgress()

    sanitized[levelId] = {
      foundWords: uniqueWords(levelProgress.foundWords).filter((word) =>
        requiredWords.has(word),
      ),
      foundBonusWords: uniqueWords(levelProgress.foundBonusWords),
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

  return sanitized
}

function sanitizeUnlockedLevelIds(
  rawUnlockedLevelIds: unknown,
  completedLevelIds: number[],
  currentLevelId: number,
) {
  const derived = deriveUnlockedLevelIds(completedLevelIds)
  const rawIds = uniqueNumbers(rawUnlockedLevelIds).filter((id) =>
    levelIdToPack.has(id),
  )
  const unlocked = new Set([...derived, ...rawIds, currentLevelId])

  return allLevelIds.filter((id) => unlocked.has(id))
}

function deriveUnlockedLevelIds(completedLevelIds: number[]) {
  const unlocked = new Set<number>()

  if (allLevelIds.length > 0) unlocked.add(allLevelIds[0])

  for (let i = 0; i < allLevelIds.length - 1; i++) {
    if (completedLevelIds.includes(allLevelIds[i])) {
      unlocked.add(allLevelIds[i + 1])
    }
  }

  return [...unlocked]
}

function sanitizeSettings(raw: Record<string, unknown>) {
  const rawSettings = isRecord(raw.settings) ? raw.settings : {}
  return { soundMuted: Boolean(rawSettings.soundMuted ?? raw.muted) }
}

function uniqueWords(words: unknown) {
  return Array.isArray(words) ? [...new Set(words.map(String).map(normalizeWord))] : []
}

function uniqueNumbers(numbers: unknown) {
  return Array.isArray(numbers)
    ? [...new Set(numbers.map(Number).filter((n) => Number.isInteger(n)))]
    : []
}

function nonNegativeNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
