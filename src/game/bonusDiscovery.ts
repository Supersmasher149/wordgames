import { dictionaryWords } from '../data/dictionary.ts'

export function discoverAllValidBonusWords(lettersBag: Readonly<string[]>): Set<string> {
  const bagCounts = new Map<string, number>()
  for (const letter of lettersBag) {
    const l = letter.toUpperCase()
    bagCounts.set(l, (bagCounts.get(l) ?? 0) + 1)
  }

  const words: Set<string> = new Set()
  for (const dictWord of dictionaryWords) {
    const word = dictWord.toUpperCase()
    if (word.length < 3) continue

    const remaining = new Map(bagCounts)
    let possible = true
    for (const char of word) {
      const count = remaining.get(char) ?? 0
      if (count === 0) { possible = false; break }
      remaining.set(char, count - 1)
    }

    if (possible) words.add(word)
  }

  return words
}

export function deduplicateAndFilterBonuses(
  requiredSet: Readonly<Set<string>>,
  discoveredBonusBag: Readonly<Set<string>>,
): string[] {
  const cleaned: string[] = []
  const sortedDiscoveries = [...discoveredBonusBag].sort()
  for (const word of sortedDiscoveries) {
    if (word.length >= 3 && !requiredSet.has(word)) {
      cleaned.push(word)
    }
  }
  return cleaned
}
