# Word Paws — Strict Crossword Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redefine Word Paws puzzle rules to use strict crossword placement, eliminating fake word runs and adding controlled difficulty.

**Architecture:** Rename `Direction` type, rewrite `gridSolver.ts` with slot boundary/adjacency/full-grid-scan rules, update validator with comprehensive checks, fix existing levels to pass.

**Tech Stack:** TypeScript, Vite, no external dependencies.

## Global Constraints

- No backend, accounts, ads, or external APIs
- No copying Wordscapes branding, levels, UI, assets, or names
- `Direction` type uses `'horizontal' | 'vertical'` (not `'across' | 'down'`)
- `LevelData` stays without `placements` or `bonusWords` — computed at runtime
- `LevelData` gains `difficulty?: Difficulty` optional field
- All validation via `npm run validate-levels` using `node --experimental-strip-types`
- Build via `npm run build` (tsc -b && vite build)
- Lint via `npm run lint` (oxlint)

---

### Task 1: Update Types — Direction Rename + Difficulty

**Files:**
- Modify: `src/game/types.ts`

**Interfaces:**
- Consumes: Nothing from prior tasks
- Produces: Updated type exports consumed by all other tasks

- [ ] **Step 1: Add `WordDirection` alias and update `Direction`**

Change `Direction` from `'across' | 'down'` to `'horizontal' | 'vertical'`. Add `WordDirection` as an alias.

```typescript
export type Direction = 'horizontal' | 'vertical'
export type WordDirection = Direction
```

- [ ] **Step 2: Add `difficulty` to `LevelData`**

```typescript
export interface LevelData {
  id: number
  title: string
  letters: string[]
  requiredWords: string[]
  difficulty?: Difficulty
}
```

(No other interfaces change — `Level`, `WordPlacement`, etc. already use `Direction`.)

- [ ] **Step 3: Verify the file compiles**

Run: `npx tsc --noEmit src/game/types.ts`
Expected: No errors (ignore import references to other files)

- [ ] **Step 4: Commit**

```bash
git add src/game/types.ts
git commit -m "feat: rename Direction to horizontal/vertical, add difficulty to LevelData"
```

---

### Task 2: Rewrite Grid Solver with Strict Crossword Rules

**Files:**
- Rewrite: `src/engine/gridSolver.ts`

**Interfaces:**
- Consumes: `WordPlacement`, `Direction` from `src/game/types.ts`
- Produces: `solveGrid(letters: string[], requiredWords: string[]): WordPlacement[] | null`

**Algorithm:**
- Virtual grid 24×24
- Place longest word first, horizontal, centered
- For remaining words: try crossings via matching letters → validate with `canPlace()`
- If no crossing possible: try island placement (separated by 1+ empty cells from all existing)
- `canPlace()` checks: letter conflicts, slot boundaries, adjacent cells (new cells only)
- After all placements: run full-grid scan to verify no fake runs
- Trim unused rows/cols, offset placements to 0-based origin
- Return `null` if any word cannot be legally placed

- [ ] **Step 1: Write the full grid solver**

Replace entire `src/engine/gridSolver.ts`:

```typescript
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

function cellKey(row: number, col: number): string {
  return `${row}:${col}`
}

function canPlace(
  grid: (string | null)[][],
  word: string,
  row: number,
  col: number,
  direction: Direction,
  existingPlacements: WordPlacement[],
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
      // Check above and below
      if (cell.row - 1 >= 0 && grid[cell.row - 1][cell.col] !== null) return false
      if (cell.row + 1 < VIRTUAL_SIZE && grid[cell.row + 1][cell.col] !== null) return false
    } else {
      // Check left and right
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
  const placementSet = new Set(
    placements.map((p) => `${p.row}:${p.col}:${p.direction}:${p.word}`),
  )

  // Scan horizontal runs
  for (let r = 0; r < VIRTUAL_SIZE; r++) {
    let c = 0
    while (c < VIRTUAL_SIZE) {
      if (grid[r][c] === null) { c++; continue }
      let end = c + 1
      while (end < VIRTUAL_SIZE && grid[r][end] !== null) end++
      const runLength = end - c
      if (runLength >= 2) {
        const runWord = grid[r].slice(c, end).join('')
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

  if (!canPlace(grid, firstWord, firstRow, firstCol, 'horizontal', [])) {
    // Try scanning for any valid placement
    let found = false
    for (let r = 1; r < VIRTUAL_SIZE - 1 && !found; r++) {
      for (let c = 1; c < VIRTUAL_SIZE - firstWord.length && !found; c++) {
        if (canPlace(grid, firstWord, r, c, 'horizontal', placements)) {
          doPlace(grid, firstWord, r, c, 'horizontal')
          placements.push({ word: firstWord, row: r, col: c, direction: 'horizontal' })
          found = true
        }
      }
    }
    if (!found) return null
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

          // Try horizontal crossing at matching letter
          const hRow = eCell.row
          const hCol = eCell.col - wi2
          if (canPlace(grid, word, hRow, hCol, 'horizontal', placements)) {
            doPlace(grid, word, hRow, hCol, 'horizontal')
            placements.push({ word, row: hRow, col: hCol, direction: 'horizontal' })
            placed = true
            break
          }

          // Try vertical crossing at matching letter
          const vRow = eCell.row - wi2
          const vCol = eCell.col
          if (canPlace(grid, word, vRow, vCol, 'vertical', placements)) {
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

    // Strategy 2: Try as a separated island (no crossings)
    if (!placed) {
      // Try horizontal islands
      for (let r = 1; r < VIRTUAL_SIZE - 1 && !placed; r++) {
        for (let c = 1; c <= VIRTUAL_SIZE - word.length - 1 && !placed; c++) {
          if (canPlace(grid, word, r, c, 'horizontal', placements)) {
            doPlace(grid, word, r, c, 'horizontal')
            placements.push({ word, row: r, col: c, direction: 'horizontal' })
            placed = true
          }
        }
      }
    }

    if (!placed) {
      // Try vertical islands
      for (let c = 1; c < VIRTUAL_SIZE - 1 && !placed; c++) {
        for (let r = 1; r <= VIRTUAL_SIZE - word.length - 1 && !placed; r++) {
          if (canPlace(grid, word, r, c, 'vertical', placements)) {
            doPlace(grid, word, r, c, 'vertical')
            placements.push({ word, row: r, col: c, direction: 'vertical' })
            placed = true
          }
        }
      }
    }

    if (!placed) return null

    // Full-grid scan after each placement to catch cumulative issues
    const scan = scanGridForFakeRuns(grid, placements)
    if (!scan.valid) {
      // Roll back this placement and try next position
      placements.pop()
      // Remove this word's cells from grid
      for (let i = 0; i < word.length; i++) {
        const r = placements.length === 0
          ? 0 : 0 // We need proper rollback — but if scan fails, layout is broken
        const c = 0
        // Grid cell clearing handled by re-try
      }
      // Clean approach: track grid mutations, undo on failure
      // Simpler: just return null if scan fails — layout can't be saved
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
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc -b`
Expected: Compilation succeeds

- [ ] **Step 3: Commit**

```bash
git add src/engine/gridSolver.ts
git commit -m "feat: rewrite gridSolver with strict crossword rules"
```

---

### Task 3: Update Puzzle Engine for Direction Rename

**Files:**
- Modify: `src/game/puzzleEngine.ts`

**Interfaces:**
- Consumes: `Direction` type from `types.ts` (now `'horizontal' | 'vertical'`)
- Produces: Same exports, all `placement.direction` comparisons updated

- [ ] **Step 1: Update direction string comparisons**

In `getPlacementCells`:
```typescript
export function getPlacementCells(placement: WordPlacement): RevealedCell[] {
  return normalizeWord(placement.word).split('').map((_, index) => ({
    row: placement.row + (placement.direction === 'vertical' ? index : 0),
    col: placement.col + (placement.direction === 'horizontal' ? index : 0),
  }))
}
```

- [ ] **Step 2: Verify no other references to `'across'` or `'down'` in puzzleEngine**

Search for `'across'` and `'down'` in the file. None should remain (only `'horizontal'` and `'vertical'`).

- [ ] **Step 3: Commit**

```bash
git add src/game/puzzleEngine.ts
git commit -m "refactor: update puzzleEngine for Direction rename"
```

---

### Task 4: Update GameScreen and CrosswordGrid for Direction Rename

**Files:**
- Modify: `src/components/CrosswordGrid.tsx` (no change needed — uses `level.words` and `buildGrid`, doesn't reference direction strings directly)
- Modify: `src/components/GameScreen.tsx` (no change needed — passes data to grid, doesn't reference direction strings)

Actually verify: check whether `GameScreen.tsx` or `CrosswordGrid.tsx` reference `'across'` or `'down'`.

- [ ] **Step 1: Check for any direction string literals in components**

Search: grep for `'across'` or `'down'` in `src/components/`

If none found, skip to step 2.

- [ ] **Step 2: Commit (if changes needed) or skip**

If no changes needed:
```bash
git add -A && git commit -m "refactor: no component changes needed for Direction rename"
```

---

### Task 5: Rewrite Level Validator with Comprehensive Checks

**Files:**
- Rewrite: `src/app-cli/validate-levels.node.mts`

**Interfaces:**
- Consumes: `solveGrid` from engine, `discoverAllValidBonusWords`/`deduplicateAndFilterBonuses` from bonusDiscovery, `PACKS` from packs, `dictionaryWords` from dictionary
- Produces: Same output format (`ValidationResult`), but with additional post-placement checks

- [ ] **Step 1: Write the complete validator**

Replace `src/app-cli/validate-levels.node.mts`:

```typescript
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

function cellKey(row: number, col: number): string {
  return `${row}:${col}`
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
    const cells = getWordCells(p.word, p.row, p.col, p.direction)

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

  // Check adjacent cell rules — for each placement cell, check perpendicular neighbors
  for (const p of placements) {
    const cells = getWordCells(p.word, p.row, p.col, p.direction)
    for (const c of cells) {
      // Only check cells that belong exclusively to this placement (not crossings)
      // A cell is exclusive if no other placement shares it
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
  const placementSet = new Set(
    placements.map((p) => `${p.row}:${p.col}:${p.direction}:${p.word}`),
  )

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

  // Letter count check
  if (letters.length < 4 || letters.length > 7) {
    issues.push({
      severity: 'error',
      packId,
      levelIndex,
      message: `Letters length (${letters.length}) must be between 4 and 7.`,
    })
  }

  // Difficulty-appropriate letter count
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

  // At least 1 required word
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

  // Run solver
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
    // Validate solver output
    issues.push(...validatePlacements(packId, levelIndex, placements))

    // Verify every required word has exactly one placement
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

    // Verify every placement references a required word
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

    // Verify placement letters match word
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

  // Bonus words
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
```

- [ ] **Step 2: Run validator to see initial state**

Run: `npm run validate-levels`
Expected: Output showing which levels pass and which fail (some failures expected)

- [ ] **Step 3: Commit**

```bash
git add src/app-cli/validate-levels.node.mts
git commit -m "feat: comprehensive level validator with full-grid scan"
```

---

### Task 6: Fix Existing Levels to Pass Validation

**Files:**
- Modify: `src/data/packs/beginnerPack.ts`
- Modify: `src/data/packs/easyPack.ts`
- Modify: `src/data/packs/mediumPack.ts`
- Modify: `src/data/packs/hardPack.ts`
- Modify: `src/data/packs/expertPack.ts`

**Interfaces:**
- Consumes: validator output from Task 5, solver behavior from Task 2
- Produces: All 5 pack files with levels fixed to pass validation

**Strategy:**
- Run `npm run validate-levels`
- For each failing level, fix the issues:
  - If solver returns null: adjust word set — add common-letter words, remove problematic words, or swap words
  - If fake run detected: adjust words or remove problematic combinations
  - If no bonus words: add a letter or adjust set
  - Never delete levels unless absolutely necessary
  - Prefer adding or replacing words over removing them
  - Keep the same answer words when possible

- [ ] **Step 1: Run validator to get current failure list**

Run: `npm run validate-levels 2>&1`
Expected: List of errors and warnings

- [ ] **Step 2: Fix beginnerPack.ts**

For each error in the beginner pack:
- If solver fails: look at the word set. The solver needs crossings. Add a word that shares a common letter with an existing word, or replace a word that doesn't connect well.
- If fake run: check which words create adjacent runs and adjust spacing
- Examples of likely fixes:
  - Level 41 `FALL` with letters `['F','A','L','L']` has only 1 required word. The solver needs more words for crossings. Add a word like `ALL`.
  - Levels with single 3-letter words need more words.

Run validator after each pass to check progress.

Commands:
```bash
npm run validate-levels
# Edit src/data/packs/beginnerPack.ts based on errors
# Repeat until beginner pack passes
```

- [ ] **Step 3: Fix easyPack.ts**

Same approach for easy pack. Example likely fixes:
- Level 62 `BOOK` with letters `['B','O','O','K']` has only 1 required word. Add `OAK` or `KO` (if >=3 letters, so `OAK`).

Run: `npm run validate-levels` repeatedly until easy pack passes.

- [ ] **Step 4: Fix mediumPack.ts**

Same approach.

- [ ] **Step 5: Fix hardPack.ts**

Same approach.

- [ ] **Step 6: Fix expertPack.ts**

Same approach.

- [ ] **Step 7: Final validation pass**

Run: `npm run validate-levels`
Expected: `✓ All packs validated successfully!`
No errors. Warnings about no bonus words acceptable.

- [ ] **Step 8: Commit all pack fixes**

```bash
git add src/data/packs/
git commit -m "fix: adjust levels to pass strict crossword validation"
```

---

### Task 7: Build and Lint Verification

**Files:**
- Check: all modified files

- [ ] **Step 1: Run full build**

Run: `npm run build`
Expected: `tsc -b` succeeds, `vite build` succeeds

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected: No lint errors

- [ ] **Step 3: Run validator one more time**

Run: `npm run validate-levels`
Expected: `✓ All packs validated successfully!`

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: build and lint verification"
```
