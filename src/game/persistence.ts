import { levels } from '../data/levels'
import type { LevelProgress, PlayerProgress } from './types'
import { createEmptyLevelProgress } from './puzzleEngine'

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

    return { ...createDefaultProgress(), ...JSON.parse(saved) }
  } catch {
    return createDefaultProgress()
  }
}

export function saveProgress(progress: PlayerProgress) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function resetProgress() {
  window.localStorage.removeItem(STORAGE_KEY)
  return createDefaultProgress()
}
