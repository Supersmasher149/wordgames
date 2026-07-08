import type {
  Direction,
  LevelData,
  ValidationIssue,
  ValidationResult,
  WordPlacement,
} from '../game/types.ts'
import { dictionaryWords } from '../data/dictionary.ts'
import { solveGrid } from '../engine/gridSolver.ts'
import { discoverAllValidBonusWords, deduplicateAndFilterBonuses } from '../game/bonusDiscovery.ts'
import { PACKS } from '../data/packs/index.ts'

const VIRTUAL_SIZE = 24

function canSpellFromLetters(letters: string[], word: string): boolean {
  const counts = new Map<string, number>()
  for (const letter of letters) {
    counts.set(letter, (counts.get(letter) ?? 0) + 1)
  }
  for (const char of word) {
    const count = counts.get(char) ?? 0
    if (count === 0) return false
    counts.set(char, count - 1)
  }
  return true
}

function getWordCells(
  word: string,
  row: number,
  col: number,
  direction: Direction,
): { row: number; col: number; letter: string }[] {
  const cells: { row: number; col: number; letter: string }[] = []
  for (let i = 0; i < word.length; i++) {
    cells.push({
      row: direction === 'horizontal' ? row : row + i,
      col: direction === 'horizontal' ? col + i : col,
      letter: word[i],
    })
  }
  return cells
}

function validatePlacements(
  packId: string,
  levelIndex: number,
  placements: WordPlacement[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const grid: (string | null)[][] = Array.from(
    { length: VIRTUAL_SIZE },
    () => Array(VIRTUAL_SIZE).fill(null),
  )

  // Build grid from placements
  for (const p of placements) {
    const cells = getWordCells(p.word, p.row, p.col, p.direction)
    for (const c of cells) {
      if (grid[c.row][c.col] !== null && grid[c.row][c.col] !== c.letter) {
        issues.push({
          severity: 'error',
          packId,
          levelIndex,
          message: `Placement "${p.word}" at (${p.row}, ${p.col}, ${p.direction}) conflicts at (${c.row}, ${c.col}): existing letter "${grid[c.row][c.col]}" vs "${c.letter}".`,
        })
      }
      grid[c.row][c.col] = c.letter
    }
  }

  // Check slot boundary rules
  for (const p of placements) {
    if (p.direction === 'horizontal') {
      const beforeCol = p.col - 1
      if (beforeCol >= 0 && grid[p.row][beforeCol] !== null) {
        issues.push({
          severity: 'error',
          packId,
          levelIndex,
          message: `"${p.word}" at row ${p.row} col ${p.col}: cell before (${p.row}, ${beforeCol}) must be empty, found "${grid[p.row][beforeCol]}".`,
        })
      }
      const afterCol = p.col + p.word.length
      if (afterCol < VIRTUAL_SIZE && grid[p.row][afterCol] !== null) {
        issues.push({
          severity: 'error',
          packId,
          levelIndex,
          message: `"${p.word}" at row ${p.row} col ${p.col}: cell after (${p.row}, ${afterCol}) must be empty, found "${grid[p.row][afterCol]}".`,
        })
      }
    } else {
      const beforeRow = p.row - 1
      if (beforeRow >= 0 && grid[beforeRow][p.col] !== null) {
        issues.push({
          severity: 'error',
          packId,
          levelIndex,
          message: `"${p.word}" at row ${p.row} col ${p.col}: cell before (${beforeRow}, ${p.col}) must be empty, found "${grid[beforeRow][p.col]}".`,
        })
      }
      const afterRow = p.row + p.word.length
      if (afterRow < VIRTUAL_SIZE && grid[afterRow][p.col] !== null) {
        issues.push({
          severity: 'error',
          packId,
          levelIndex,
          message: `"${p.word}" at row ${p.row} col ${p.col}: cell after (${afterRow}, ${p.col}) must be empty, found "${grid[afterRow][p.col]}".`,
        })
      }
    }
  }

  // Check adjacent cell rules
  for (const p of placements) {
    const cells = getWordCells(p.word, p.row, p.col, p.direction)
    for (const c of cells) {
      const sharingPlacements = placements.filter((other) => {
        if (other === p) return false
        const otherCells = getWordCells(other.word, other.row, other.col, other.direction)
        return otherCells.some((oc) => oc.row === c.row && oc.col === c.col)
      })
      const isExclusive = sharingPlacements.length === 0

      if (!isExclusive) continue

      if (p.direction === 'horizontal') {
        if (c.row - 1 >= 0 && grid[c.row - 1][c.col] !== null) {
          issues.push({
            severity: 'error',
            packId,
            levelIndex,
            message: `"${p.word}" letter "${c.letter}" at (${c.row}, ${c.col}): cell above (${c.row - 1}, ${c.col}) must be empty, found "${grid[c.row - 1][c.col]}".`,
          })
        }
        if (c.row + 1 < VIRTUAL_SIZE && grid[c.row + 1][c.col] !== null) {
          issues.push({
            severity: 'error',
            packId,
            levelIndex,
            message: `"${p.word}" letter "${c.letter}" at (${c.row}, ${c.col}): cell below (${c.row + 1}, ${c.col}) must be empty, found "${grid[c.row + 1][c.col]}".`,
          })
        }
      } else {
        if (c.col - 1 >= 0 && grid[c.row][c.col - 1] !== null) {
          issues.push({
            severity: 'error',
            packId,
            levelIndex,
            message: `"${p.word}" letter "${c.letter}" at (${c.row}, ${c.col}): cell left (${c.row}, ${c.col - 1}) must be empty, found "${grid[c.row][c.col - 1]}".`,
          })
        }
        if (c.col + 1 < VIRTUAL_SIZE && grid[c.row][c.col + 1] !== null) {
          issues.push({
            severity: 'error',
            packId,
            levelIndex,
            message: `"${p.word}" letter "${c.letter}" at (${c.row}, ${c.col}): cell right (${c.row}, ${c.col + 1}) must be empty, found "${grid[c.row][c.col + 1]}".`,
          })
        }
      }
    }
  }

  // Full-grid scan for unintended runs
  // Horizontal runs
  for (let r = 0; r < VIRTUAL_SIZE; r++) {
    let c = 0
    while (c < VIRTUAL_SIZE) {
      if (grid[r][c] === null) { c++; continue }
      let end = c + 1
      while (end < VIRTUAL_SIZE && grid[r][end] !== null) end++
      const runLen = end - c
      if (runLen >= 2) {
        const runLetters: string[] = []
        for (let i = c; i < end; i++) runLetters.push(grid[r][i]!)
        const runWord = runLetters.join('')
        const isRequired = placements.some(
          (p) => p.direction === 'horizontal' && p.row === r && p.col === c && p.word === runWord,
        )
        if (!isRequired) {
          issues.push({
            severity: 'error',
            packId,
            levelIndex,
            message: `Unintended horizontal run "${runWord}" at row ${r} col ${c}. This run is not a required word placement. Add spacing or change placements.`,
          })
        }
      }
      c = end
    }
  }

  // Vertical runs
  for (let c = 0; c < VIRTUAL_SIZE; c++) {
    let r = 0
    while (r < VIRTUAL_SIZE) {
      if (grid[r][c] === null) { r++; continue }
      let end = r + 1
      while (end < VIRTUAL_SIZE && grid[end][c] !== null) end++
      const runLen = end - r
      if (runLen >= 2) {
        const runLetters: string[] = []
        for (let i = r; i < end; i++) runLetters.push(grid[i][c]!)
        const runWord = runLetters.join('')
        const isRequired = placements.some(
          (p) => p.direction === 'vertical' && p.col === c && p.row === r && p.word === runWord,
        )
        if (!isRequired) {
          issues.push({
            severity: 'error',
            packId,
            levelIndex,
            message: `Unintended vertical run "${runWord}" at col ${c} row ${r}. This run is not a required word placement. Add spacing or change placements.`,
          })
        }
      }
      r = end
    }
  }

  return issues
}

const DIFFICULTY_LETTER_RANGES: Record<string, [number, number]> = {
  beginner: [3, 4],
  easy: [4, 5],
  medium: [5, 6],
  hard: [6, 7],
  expert: [7, 7],
}

function validateLevelData(
  packId: string,
  levelIndex: number,
  level: LevelData,
  packDifficulty: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const letters = level.letters.map((l) => l.toUpperCase())
  const requiredWords = level.requiredWords.map((w) => w.toUpperCase())

  const difficulty = level.difficulty ?? packDifficulty

  if (letters.length < 4 || letters.length > 7) {
    issues.push({
      severity: 'error',
      packId,
      levelIndex,
      message: `Letters length (${letters.length}) must be between 4 and 7.`,
    })
  }

  const letterRange = DIFFICULTY_LETTER_RANGES[difficulty]
  if (letterRange) {
    if (letters.length < letterRange[0] || letters.length > letterRange[1]) {
      issues.push({
        severity: 'warning',
        packId,
        levelIndex,
        message: `Difficulty "${difficulty}" typically uses ${letterRange[0]}-${letterRange[1]} letters, got ${letters.length}.`,
      })
    }
  }

  if (requiredWords.length < 1) {
    issues.push({
      severity: 'error',
      packId,
      levelIndex,
      message: 'Level must have at least 1 required word, got 0.',
    })
  }

  const seenWords = new Set<string>()
  for (const word of requiredWords) {
    if (word.length < 3) {
      issues.push({
        severity: 'error',
        packId,
        levelIndex,
        message: `Required word "${word}" is too short (min 3 letters).`,
      })
    }

    if (seenWords.has(word)) {
      issues.push({
        severity: 'error',
        packId,
        levelIndex,
        message: `Duplicate required word "${word}".`,
      })
    }
    seenWords.add(word)

    if (!canSpellFromLetters(letters, word)) {
      issues.push({
        severity: 'error',
        packId,
        levelIndex,
        message: `Required word "${word}" cannot be formed from letters [${letters.join(', ')}].`,
      })
    }

    if (!dictionaryWords.has(word)) {
      issues.push({
        severity: 'error',
        packId,
        levelIndex,
        message: `Required word "${word}" is not in the dictionary.`,
      })
    }
  }

  const placements = solveGrid(letters, requiredWords)
  if (placements === null) {
    issues.push({
      severity: 'error',
      packId,
      levelIndex,
      message: `Could not place required words [${requiredWords.join(', ')}] in the grid. The solver was unable to find a valid layout.`,
      suggestion: 'Try adding words that share common letters, or adjusting the word set for better connectivity.',
    })
  } else {
    issues.push(...validatePlacements(packId, levelIndex, placements))

    for (const word of requiredWords) {
      const wordPlacements = placements.filter((p) => p.word === word)
      if (wordPlacements.length === 0) {
        issues.push({
          severity: 'error',
          packId,
          levelIndex,
          message: `Required word "${word}" has no placement in solver output.`,
        })
      } else if (wordPlacements.length > 1) {
        issues.push({
          severity: 'error',
          packId,
          levelIndex,
          message: `Required word "${word}" has ${wordPlacements.length} placements (expected 1).`,
        })
      }
    }

    const requiredSet = new Set(requiredWords)
    for (const p of placements) {
      if (!requiredSet.has(p.word)) {
        issues.push({
          severity: 'error',
          packId,
          levelIndex,
          message: `Placement "${p.word}" does not correspond to any required word.`,
        })
      }
    }

    for (const p of placements) {
      const cells = getWordCells(p.word, p.row, p.col, p.direction)
      for (let i = 0; i < p.word.length; i++) {
        if (cells[i].letter !== p.word[i]) {
          issues.push({
            severity: 'error',
            packId,
            levelIndex,
            message: `Placement "${p.word}" cell ${i} letter mismatch: expected "${p.word[i]}", got "${cells[i].letter}".`,
          })
        }
      }
    }
  }

  const bonusCandidates = discoverAllValidBonusWords(letters)
  const cleanBonuses = deduplicateAndFilterBonuses(new Set(requiredWords), bonusCandidates)
  if (cleanBonuses.length === 0) {
    issues.push({
      severity: 'warning',
      packId,
      levelIndex,
      message: 'No bonus words discovered for this letter set.',
    })
  }

  return issues
}

function validateAllPacks(): ValidationResult {
  const issues: ValidationIssue[] = []
  const seenIds = new Map<number, string>()

  for (const packDef of PACKS) {
    const packId = packDef.pack.id
    const packDifficulty = packDef.pack.difficulty

    for (let i = 0; i < packDef.levels.length; i++) {
      const level = packDef.levels[i]

      if (seenIds.has(level.id)) {
        issues.push({
          severity: 'error',
          packId,
          levelIndex: i,
          message: `Duplicate level id ${level.id} (also used in pack "${seenIds.get(level.id)}").`,
        })
      }
      seenIds.set(level.id, packId)

      issues.push(...validateLevelData(packId, i, level, packDifficulty))
    }
  }

  if (issues.length === 0) return { kind: 'pass' }
  return { kind: 'fail', issues }
}

const result = validateAllPacks()

if (result.kind === 'pass') {
  console.log('✓ All packs validated successfully!')
  process.exit(0)
}

let errorCount = 0
let warningCount = 0
let infoCount = 0

for (const issue of result.issues) {
  if (issue.severity === 'error') errorCount++
  else if (issue.severity === 'warning') warningCount++
  else infoCount++
}

console.log(`\nValidation complete: ${errorCount} errors, ${warningCount} warnings, ${infoCount} info\n`)

for (const issue of result.issues) {
  const prefix = issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '!' : 'i'
  console.log(`  ${prefix} [${issue.packId}:${issue.levelIndex}] ${issue.message}`)
  if (issue.suggestion) {
    console.log(`    Suggestion: ${issue.suggestion}`)
  }
}

console.log('')
process.exit(errorCount > 0 ? 1 : 0)
