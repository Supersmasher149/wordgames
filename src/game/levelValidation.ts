import type { Level, WordPlacement } from './types'
import { getCellKey, getPlacementCells, normalizeWord } from './puzzleEngine'

export type LevelValidationIssue = {
  levelId: number
  message: string
}

export function validateLevels(levels: Level[]) {
  const issues: LevelValidationIssue[] = []
  const seenIds = new Set<number>()

  for (const level of levels) {
    if (seenIds.has(level.id)) {
      issues.push({ levelId: level.id, message: `Duplicate level id ${level.id}.` })
    }

    seenIds.add(level.id)
    issues.push(...validateLevel(level))
  }

  return issues
}

export function validateLevel(level: Level) {
  const issues: LevelValidationIssue[] = []
  const availableLetters = level.letters.map(normalizeWord)
  const requiredWords = new Set<string>()
  const allWords = new Set<string>()
  const occupiedCells = new Map<string, string>()

  if (!Number.isInteger(level.id) || level.id <= 0) {
    issues.push({ levelId: level.id, message: 'Level id must be a positive integer.' })
  }

  if (!level.title.trim()) {
    issues.push({ levelId: level.id, message: 'Level title cannot be empty.' })
  }

  if (availableLetters.length === 0 || availableLetters.some((letter) => !letter)) {
    issues.push({ levelId: level.id, message: 'Level must define available letters.' })
  }

  if (level.words.length === 0) {
    issues.push({ levelId: level.id, message: 'Level must define required words.' })
  }

  for (const placement of level.words) {
    const word = normalizeWord(placement.word)

    if (!word) {
      issues.push({ levelId: level.id, message: 'Required word cannot be empty.' })
      continue
    }

    if (requiredWords.has(word)) {
      issues.push({ levelId: level.id, message: `Duplicate required word: ${word}.` })
    }

    requiredWords.add(word)
    allWords.add(word)

    if (!canSpellWord(availableLetters, word)) {
      issues.push({
        levelId: level.id,
        message: `Required word ${word} cannot be made from available letters.`,
      })
    }

    issues.push(...validatePlacement(level.id, placement))
    getPlacementCells(placement).forEach((cell, index) => {
      const key = getCellKey(cell)
      const letter = word[index]
      const existingLetter = occupiedCells.get(key)

      if (existingLetter && existingLetter !== letter) {
        issues.push({
          levelId: level.id,
          message: `Grid conflict at row ${cell.row}, col ${cell.col}: ${existingLetter} vs ${letter}.`,
        })
      }

      occupiedCells.set(key, letter)
    })
  }

  for (const rawBonusWord of level.bonusWords) {
    const bonusWord = normalizeWord(rawBonusWord)

    if (!bonusWord) {
      issues.push({ levelId: level.id, message: 'Bonus word cannot be empty.' })
      continue
    }

    if (allWords.has(bonusWord)) {
      issues.push({ levelId: level.id, message: `Duplicate word: ${bonusWord}.` })
    }

    allWords.add(bonusWord)

    if (!canSpellWord(availableLetters, bonusWord)) {
      issues.push({
        levelId: level.id,
        message: `Bonus word ${bonusWord} cannot be made from available letters.`,
      })
    }
  }

  return issues
}

export function canSpellWord(availableLetters: string[], rawWord: string) {
  const counts = new Map<string, number>()

  for (const letter of availableLetters.map(normalizeWord)) {
    counts.set(letter, (counts.get(letter) ?? 0) + 1)
  }

  for (const letter of normalizeWord(rawWord)) {
    const remaining = counts.get(letter) ?? 0

    if (remaining === 0) {
      return false
    }

    counts.set(letter, remaining - 1)
  }

  return true
}

function validatePlacement(levelId: number, placement: WordPlacement) {
  const issues: LevelValidationIssue[] = []

  if (!Number.isInteger(placement.row) || placement.row < 0) {
    issues.push({ levelId, message: `${placement.word} row must be a non-negative integer.` })
  }

  if (!Number.isInteger(placement.col) || placement.col < 0) {
    issues.push({ levelId, message: `${placement.word} col must be a non-negative integer.` })
  }

  if (placement.direction !== 'across' && placement.direction !== 'down') {
    issues.push({ levelId, message: `${placement.word} direction must be across or down.` })
  }

  return issues
}
