import type { WordPlacement, Direction } from '../game/types.ts'

const VIRTUAL_SIZE = 24
const MID = Math.floor(VIRTUAL_SIZE / 2)

interface PlacedCell {
  row: number
  col: number
  letter: string
}

function getWordCells(
  word: string,
  row: number,
  col: number,
  direction: Direction,
): PlacedCell[] {
  const cells: PlacedCell[] = []
  for (let i = 0; i < word.length; i++) {
    cells.push({
      row: direction === 'horizontal' ? row : row + i,
      col: direction === 'horizontal' ? col + i : col,
      letter: word[i],
    })
  }
  return cells
}

function canPlace(
  grid: (string | null)[][],
  word: string,
  row: number,
  col: number,
  direction: Direction,
): boolean {
  const cells = getWordCells(word, row, col, direction)

  // 1. Bounds and letter conflict check
  for (const cell of cells) {
    if (cell.row < 0 || cell.row >= VIRTUAL_SIZE || cell.col < 0 || cell.col >= VIRTUAL_SIZE) {
      return false
    }
    const existing = grid[cell.row][cell.col]
    if (existing !== null && existing !== cell.letter) {
      return false
    }
  }

  // 2. Slot boundary rules — cell before/after must be empty or out of bounds
  if (direction === 'horizontal') {
    const beforeCol = col - 1
    if (beforeCol >= 0 && grid[row][beforeCol] !== null) return false
    const afterCol = col + word.length
    if (afterCol < VIRTUAL_SIZE && grid[row][afterCol] !== null) return false
  } else {
    const beforeRow = row - 1
    if (beforeRow >= 0 && grid[beforeRow][col] !== null) return false
    const afterRow = row + word.length
    if (afterRow < VIRTUAL_SIZE && grid[afterRow][col] !== null) return false
  }

  // 3. Adjacent cell rules — for NEW cells only, perpendicular neighbors must be empty
  for (const cell of cells) {
    if (grid[cell.row][cell.col] !== null) {
      // Existing cell (crossing) — already validated when placed
      continue
    }

    if (direction === 'horizontal') {
      if (cell.row - 1 >= 0 && grid[cell.row - 1][cell.col] !== null) return false
      if (cell.row + 1 < VIRTUAL_SIZE && grid[cell.row + 1][cell.col] !== null) return false
    } else {
      if (cell.col - 1 >= 0 && grid[cell.row][cell.col - 1] !== null) return false
      if (cell.col + 1 < VIRTUAL_SIZE && grid[cell.row][cell.col + 1] !== null) return false
    }
  }

  return true
}

function doPlace(
  grid: (string | null)[][],
  word: string,
  row: number,
  col: number,
  direction: Direction,
): void {
  for (let i = 0; i < word.length; i++) {
    const r = direction === 'horizontal' ? row : row + i
    const c = direction === 'horizontal' ? col + i : col
    grid[r][c] = word[i]
  }
}

function scanGridForFakeRuns(
  grid: (string | null)[][],
  placements: WordPlacement[],
): { valid: boolean; message?: string } {
  // Scan horizontal runs
  for (let r = 0; r < VIRTUAL_SIZE; r++) {
    let c = 0
    while (c < VIRTUAL_SIZE) {
      if (grid[r][c] === null) { c++; continue }
      let end = c + 1
      while (end < VIRTUAL_SIZE && grid[r][end] !== null) end++
      const runLength = end - c
      if (runLength >= 2) {
        const runLetters: string[] = []
        for (let i = c; i < end; i++) runLetters.push(grid[r][i]!)
        const runWord = runLetters.join('')
        const matches = placements.some(
          (p) =>
            p.direction === 'horizontal' &&
            p.row === r &&
            p.col === c &&
            p.word === runWord,
        )
        if (!matches) {
          return { valid: false, message: `Unintended horizontal run "${runWord}" at row ${r} col ${c}.` }
        }
      }
      c = end
    }
  }

  // Scan vertical runs
  for (let c = 0; c < VIRTUAL_SIZE; c++) {
    let r = 0
    while (r < VIRTUAL_SIZE) {
      if (grid[r][c] === null) { r++; continue }
      let end = r + 1
      while (end < VIRTUAL_SIZE && grid[end][c] !== null) end++
      const runLength = end - r
      if (runLength >= 2) {
        const runLetters: string[] = []
        for (let i = r; i < end; i++) runLetters.push(grid[i][c]!)
        const runWord = runLetters.join('')
        const matches = placements.some(
          (p) =>
            p.direction === 'vertical' &&
            p.col === c &&
            p.row === r &&
            p.word === runWord,
        )
        if (!matches) {
          return { valid: false, message: `Unintended vertical run "${runWord}" at col ${c} row ${r}.` }
        }
      }
      r = end
    }
  }

  return { valid: true }
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
    { length: VIRTUAL_SIZE },
    () => Array(VIRTUAL_SIZE).fill(null),
  )

  const placements: WordPlacement[] = []

  // Place first word — longest, horizontal, centered
  const firstWord = sorted[0]
  const firstCol = MID - Math.floor(firstWord.length / 2)
  const firstRow = MID

  if (!canPlace(grid, firstWord, firstRow, firstCol, 'horizontal')) {
    let foundFirst = false
    for (let r = 1; r < VIRTUAL_SIZE - 1 && !foundFirst; r++) {
      for (let c = 1; c <= VIRTUAL_SIZE - firstWord.length - 1 && !foundFirst; c++) {
        if (canPlace(grid, firstWord, r, c, 'horizontal')) {
          doPlace(grid, firstWord, r, c, 'horizontal')
          placements.push({ word: firstWord, row: r, col: c, direction: 'horizontal' })
          foundFirst = true
        }
      }
    }
    if (!foundFirst) return null
  } else {
    doPlace(grid, firstWord, firstRow, firstCol, 'horizontal')
    placements.push({ word: firstWord, row: firstRow, col: firstCol, direction: 'horizontal' })
  }

  // Place remaining words
  for (let wi = 1; wi < sorted.length; wi++) {
    const word = sorted[wi]
    let placed = false

    // Strategy 1: Try crossings with existing words
    for (const existing of placements) {
      const existingCells = getWordCells(existing.word, existing.row, existing.col, existing.direction)

      for (const eCell of existingCells) {
        for (let wi2 = 0; wi2 < word.length; wi2++) {
          if (word[wi2] !== eCell.letter) continue

          // Try horizontal crossing
          const hRow = eCell.row
          const hCol = eCell.col - wi2
          if (canPlace(grid, word, hRow, hCol, 'horizontal')) {
            doPlace(grid, word, hRow, hCol, 'horizontal')
            placements.push({ word, row: hRow, col: hCol, direction: 'horizontal' })
            placed = true
            break
          }

          // Try vertical crossing
          const vRow = eCell.row - wi2
          const vCol = eCell.col
          if (canPlace(grid, word, vRow, vCol, 'vertical')) {
            doPlace(grid, word, vRow, vCol, 'vertical')
            placements.push({ word, row: vRow, col: vCol, direction: 'vertical' })
            placed = true
            break
          }
        }
        if (placed) break
      }
      if (placed) break
    }

    // Strategy 2: Try as a separated island, preferring proximity to existing cluster
    if (!placed) {
      let centerRow = 0, centerCol = 0, count = 0
      for (const p of placements) {
        const cells = getWordCells(p.word, p.row, p.col, p.direction)
        for (const c of cells) {
          centerRow += c.row
          centerCol += c.col
          count++
        }
      }
      centerRow = Math.round(centerRow / count)
      centerCol = Math.round(centerCol / count)

      let bestPos: { row: number; col: number; direction: Direction } | null = null
      let bestDist = Infinity

      for (let r = 1; r < VIRTUAL_SIZE - 1; r++) {
        for (let c = 1; c <= VIRTUAL_SIZE - word.length - 1; c++) {
          if (canPlace(grid, word, r, c, 'horizontal')) {
            const dist = Math.abs(r - centerRow) + Math.abs(c - centerCol)
            if (dist < bestDist) { bestDist = dist; bestPos = { row: r, col: c, direction: 'horizontal' } }
          }
        }
      }

      for (let c = 1; c < VIRTUAL_SIZE - 1; c++) {
        for (let r = 1; r <= VIRTUAL_SIZE - word.length - 1; r++) {
          if (canPlace(grid, word, r, c, 'vertical')) {
            const dist = Math.abs(r - centerRow) + Math.abs(c - centerCol)
            if (dist < bestDist) { bestDist = dist; bestPos = { row: r, col: c, direction: 'vertical' } }
          }
        }
      }

      if (bestPos) {
        doPlace(grid, word, bestPos.row, bestPos.col, bestPos.direction)
        placements.push({ word, row: bestPos.row, col: bestPos.col, direction: bestPos.direction })
        placed = true
      }
    }

    if (!placed) return null

    // Full-grid scan after each placement
    const scan = scanGridForFakeRuns(grid, placements)
    if (!scan.valid) {
      return null
    }
  }

  // Find bounds
  let minRow = VIRTUAL_SIZE, maxRow = 0, minCol = VIRTUAL_SIZE, maxCol = 0
  for (const p of placements) {
    const cells = getWordCells(p.word, p.row, p.col, p.direction)
    for (const c of cells) {
      minRow = Math.min(minRow, c.row)
      maxRow = Math.max(maxRow, c.row)
      minCol = Math.min(minCol, c.col)
      maxCol = Math.max(maxCol, c.col)
    }
  }

  // Offset to 0-based
  return placements.map((p) => ({
    word: p.word,
    row: p.row - minRow,
    col: p.col - minCol,
    direction: p.direction as Direction,
  }))
}
