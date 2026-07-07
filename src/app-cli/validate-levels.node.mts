import type { LevelData, ValidationIssue, ValidationResult } from '../game/types.ts'
import { dictionaryWords } from '../data/dictionary.ts'
import { solveGrid } from '../engine/gridSolver.ts'
import { discoverAllValidBonusWords, deduplicateAndFilterBonuses } from '../game/bonusDiscovery.ts'
import { PACKS } from '../data/packs/index.ts'

function validateLevelData(packId: string, levelIndex: number, level: LevelData): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const letters = level.letters.map((l) => l.toUpperCase())
  const requiredWords = level.requiredWords.map((w) => w.toUpperCase())

  if (letters.length < 4 || letters.length > 7) {
    issues.push({
      severity: 'error',
      packId,
      levelIndex,
      message: `Letters length (${letters.length}) must be between 4 and 7.`,
    })
  }

  if (requiredWords.length < 1) {
    issues.push({
      severity: 'error',
      packId,
      levelIndex,
      message: `Level must have at least 1 required word, got 0.`,
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

  const result = solveGrid(letters, requiredWords)
  if (result === null) {
    issues.push({
      severity: 'error',
      packId,
      levelIndex,
      message: `Could not place required words [${requiredWords.join(', ')}] in the grid. The solver was unable to find a valid layout.`,
      suggestion: 'Try adding words that share common letters, or reduce the word count.',
    })
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

function validateAllPacks(): ValidationResult {
  const issues: ValidationIssue[] = []
  const seenIds = new Map<number, string>()

  for (const packDef of PACKS) {
    const packId = packDef.pack.id

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

      issues.push(...validateLevelData(packId, i, level))
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
