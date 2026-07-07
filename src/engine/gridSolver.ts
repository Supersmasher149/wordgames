import type { WordPlacement, Direction } from '../game/types.ts'

const GRID_SIZE = 8

interface PlacedCell {
  row: number
  col: number
  letter: string
}

interface PlacementResult {
  row: number
  col: number
  cells: PlacedCell[]
}

export function solveGrid(
  _letters: string[],
  requiredWords: Readonly<string[]>,
): WordPlacement[] | null {
  if (requiredWords.length === 0) return []

  const sorted = [...requiredWords]
    .map((w) => w.toUpperCase())
    .sort((a, b) => b.length - a.length)

  const grid: (string | null)[][] = Array.from(
    { length: GRID_SIZE },
    () => Array(GRID_SIZE).fill(null),
  )

  const placed: Array<{ word: string; placement: WordPlacement; cells: PlacedCell[] }> = []

  const firstWord = sorted[0]
  const firstCol = Math.max(0, Math.floor((GRID_SIZE - firstWord.length) / 2))
  const firstRow = Math.floor((GRID_SIZE - 1) / 2)

  const firstCells: PlacedCell[] = []
  for (let i = 0; i < firstWord.length; i++) {
    grid[firstRow][firstCol + i] = firstWord[i]
    firstCells.push({ row: firstRow, col: firstCol + i, letter: firstWord[i] })
  }
  placed.push({
    word: firstWord,
    placement: { word: firstWord, row: firstRow, col: firstCol, direction: 'across' },
    cells: firstCells,
  })

  for (let wIndex = 1; wIndex < sorted.length; wIndex++) {
    const word = sorted[wIndex]
    let best: { placement: WordPlacement; cells: PlacedCell[] } | null = null

    for (const existing of placed) {
      for (let ei = 0; ei < existing.cells.length; ei++) {
        const cell = existing.cells[ei]
        for (let wi = 0; wi < word.length; wi++) {
          if (word[wi] !== cell.letter) continue

          const acrossResult = tryPlace(word, 'across', cell.row, cell.col - wi, grid)
          if (acrossResult && hasExistingOverlap(acrossResult.cells, grid)) {
            if (!best || newCellsCount(acrossResult.cells, grid) > newCellsCount(best.cells, grid)) {
              best = {
                placement: { word, row: acrossResult.row, col: acrossResult.col, direction: 'across' },
                cells: acrossResult.cells,
              }
            }
          }

          const downResult = tryPlace(word, 'down', cell.row - wi, cell.col, grid)
          if (downResult && hasExistingOverlap(downResult.cells, grid)) {
            if (!best || newCellsCount(downResult.cells, grid) > newCellsCount(best.cells, grid)) {
              best = {
                placement: { word, row: downResult.row, col: downResult.col, direction: 'down' },
                cells: downResult.cells,
              }
            }
          }
        }
      }
    }

    if (!best) return null

    for (const cell of best.cells) {
      grid[cell.row][cell.col] = cell.letter
    }
    placed.push({ word, placement: best.placement, cells: best.cells })
  }

  const minRow = Math.min(...placed.flatMap((p) => p.cells.map((c) => c.row)))
  const minCol = Math.min(...placed.flatMap((p) => p.cells.map((c) => c.col)))

  return placed.map((p) => ({
    word: p.word,
    row: p.placement.row - minRow,
    col: p.placement.col - minCol,
    direction: p.placement.direction,
  }))
}

function tryPlace(
  word: string,
  direction: Direction,
  startRow: number,
  startCol: number,
  grid: (string | null)[][],
): PlacementResult | null {
  const cells: PlacedCell[] = []

  for (let i = 0; i < word.length; i++) {
    const row = direction === 'down' ? startRow + i : startRow
    const col = direction === 'across' ? startCol + i : startCol

    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
      return null
    }

    const existing = grid[row][col]
    if (existing !== null && existing !== word[i]) {
      return null
    }

    cells.push({ row, col, letter: word[i] })
  }

  return { row: startRow, col: startCol, cells }
}

function hasExistingOverlap(cells: PlacedCell[], grid: (string | null)[][]): boolean {
  return cells.some((c) => grid[c.row][c.col] !== null)
}

function newCellsCount(cells: PlacedCell[], grid: (string | null)[][]): number {
  return cells.filter((c) => grid[c.row][c.col] === null).length
}
