export type Direction = 'across' | 'down'

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
  coins: number
  usedHints: number
  settings: PlayerSettings
  levels: Record<number, LevelProgress>
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
