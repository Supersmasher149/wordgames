export type Direction = 'horizontal' | 'vertical'

export type WordDirection = Direction

export interface WordPlacement {
  word: string
  row: number
  col: number
  direction: Direction
}

export interface Level {
  id: number
  title: string
  letters: string[]
  words: WordPlacement[]
  bonusWords: string[]
}

export interface RevealedCell {
  row: number
  col: number
}

export interface LevelProgress {
  foundWords: string[]
  foundBonusWords: string[]
  revealedCells: RevealedCell[]
}

export interface PlayerSettings {
  soundMuted: boolean
}

export interface PlayerProgress {
  version: number
  currentLevelId: number
  unlockedLevelIds: number[]
  completedLevelIds: number[]
  currentPackId: string
  currentLevelIndex: number
  packsUnlocked: Record<string, boolean>
  packsCompleted: Record<string, number>
  coins: number
  usedHints: number
  settings: PlayerSettings
  levels: Record<number, LevelProgress>
}

export interface LevelData {
  id: number
  title: string
  letters: string[]
  requiredWords: string[]
  difficulty?: Difficulty
}

export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert'

export interface LevelPack {
  id: string
  displayName: string
  description: string
  difficulty: Difficulty
}

export interface PackDefinition {
  pack: LevelPack
  levels: readonly LevelData[]
}

export type ValidationSeverity = 'error' | 'warning' | 'info'

export interface ValidationIssue {
  severity: ValidationSeverity
  packId: string
  levelIndex: number
  message: string
  suggestion?: string
}

export type ValidationResult =
  | { kind: 'pass' }
  | { kind: 'fail'; issues: ValidationIssue[] }

export type LegacyFlatIds = {
  unlockedLevelIds: number[]
  completedLevelIds: number[]
  currentLevelId: number
}

export interface GridCell {
  row: number
  col: number
  letter: string
  visible: boolean
  filled: boolean
  hinted: boolean
}

export interface GridView {
  rows: Array<Array<GridCell | null>>
  minRow: number
  minCol: number
}

export type SubmissionResult =
  | { kind: 'required'; word: string }
  | { kind: 'bonus'; word: string; coins: number }
  | { kind: 'duplicate'; word: string }
  | { kind: 'invalid'; word: string }
