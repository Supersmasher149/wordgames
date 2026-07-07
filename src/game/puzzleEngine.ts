import type {
  GridCell,
  GridView,
  Level,
  LevelProgress,
  RevealedCell,
  SubmissionResult,
  WordPlacement,
} from './types'

const BONUS_REWARD = 3

export function normalizeWord(word: string) {
  return word.trim().toUpperCase()
}

export function createEmptyLevelProgress(): LevelProgress {
  return {
    foundWords: [],
    foundBonusWords: [],
    revealedCells: [],
  }
}

export function isLevelComplete(level: Level, progress: LevelProgress) {
  return level.words.every((placement) =>
    progress.foundWords.includes(normalizeWord(placement.word)),
  )
}

export function evaluateSubmission(
  level: Level,
  progress: LevelProgress,
  rawWord: string,
): SubmissionResult {
  const word = normalizeWord(rawWord)
  const requiredWords = level.words.map((placement) => normalizeWord(placement.word))
  const bonusWords = level.bonusWords.map(normalizeWord)

  if (!word) {
    return { kind: 'invalid', word }
  }

  if (
    progress.foundWords.includes(word) ||
    progress.foundBonusWords.includes(word)
  ) {
    return { kind: 'duplicate', word }
  }

  if (requiredWords.includes(word)) {
    return { kind: 'required', word }
  }

  if (bonusWords.includes(word)) {
    return { kind: 'bonus', word, coins: BONUS_REWARD }
  }

  return { kind: 'invalid', word }
}

export function buildGrid(level: Level, progress: LevelProgress): GridView {
  const cells = new Map<string, GridCell>()
  let minRow = Number.POSITIVE_INFINITY
  let maxRow = Number.NEGATIVE_INFINITY
  let minCol = Number.POSITIVE_INFINITY
  let maxCol = Number.NEGATIVE_INFINITY

  for (const placement of level.words) {
    const found = progress.foundWords.includes(normalizeWord(placement.word))

    getPlacementCells(placement).forEach((cell, index) => {
      const key = getCellKey(cell)
      const hinted = hasCell(progress.revealedCells, cell)
      const existing = cells.get(key)

      // Overlapping placements share one visible crossword cell.
      cells.set(key, {
        row: cell.row,
        col: cell.col,
        letter: existing?.letter ?? normalizeWord(placement.word)[index],
        visible: found || hinted || existing?.visible === true,
        filled: found || existing?.filled === true,
        hinted: hinted || existing?.hinted === true,
      })

      minRow = Math.min(minRow, cell.row)
      maxRow = Math.max(maxRow, cell.row)
      minCol = Math.min(minCol, cell.col)
      maxCol = Math.max(maxCol, cell.col)
    })
  }

  const rows: GridView['rows'] = []

  for (let row = minRow; row <= maxRow; row += 1) {
    const renderedRow: Array<GridCell | null> = []

    for (let col = minCol; col <= maxCol; col += 1) {
      renderedRow.push(cells.get(getCellKey({ row, col })) ?? null)
    }

    rows.push(renderedRow)
  }

  return { rows, minRow, minCol }
}

export function getHintCell(
  level: Level,
  progress: LevelProgress,
): RevealedCell | null {
  const grid = buildGrid(level, progress)
  const hiddenCells = grid.rows
    .flat()
    .filter((cell): cell is GridCell => Boolean(cell && !cell.visible))

  if (hiddenCells.length === 0) {
    return null
  }

  const randomCell = hiddenCells[Math.floor(Math.random() * hiddenCells.length)]
  return { row: randomCell.row, col: randomCell.col }
}

export function getPlacementCells(placement: WordPlacement): RevealedCell[] {
  return normalizeWord(placement.word).split('').map((_, index) => ({
    row: placement.row + (placement.direction === 'down' ? index : 0),
    col: placement.col + (placement.direction === 'across' ? index : 0),
  }))
}

export function getCellKey(cell: RevealedCell) {
  return `${cell.row}:${cell.col}`
}

function hasCell(cells: RevealedCell[], target: RevealedCell) {
  return cells.some((cell) => cell.row === target.row && cell.col === target.col)
}
