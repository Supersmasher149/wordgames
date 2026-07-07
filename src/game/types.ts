export type Direction = 'across' | 'down'

export type WordPlacement = {
  word: string
  row: number
  col: number
  direction: Direction
}

export type Level = {
  id: number
  title: string
  letters: string[]
  words: WordPlacement[]
  bonusWords: string[]
}

export type RevealedCell = {
  row: number
  col: number
}

export type LevelProgress = {
  foundWords: string[]
  foundBonusWords: string[]
  revealedCells: RevealedCell[]
}

export type PlayerProgress = {
  currentLevelId: number
  completedLevelIds: number[]
  coins: number
  usedHints: number
  muted: boolean
  levels: Record<number, LevelProgress>
}

export type GridCell = {
  row: number
  col: number
  letter: string
  visible: boolean
  filled: boolean
  hinted: boolean
}

export type GridView = {
  rows: Array<Array<GridCell | null>>
  minRow: number
  minCol: number
}

export type SubmissionResult =
  | { kind: 'required'; word: string }
  | { kind: 'bonus'; word: string; coins: number }
  | { kind: 'duplicate'; word: string }
  | { kind: 'invalid'; word: string }
