import rawDictionary from './dictionary.json'

export const dictionaryWords = new Set(
  (rawDictionary as string[]).map(normalizeDictionaryWord),
)

export function isDictionaryWord(word: string) {
  return dictionaryWords.has(normalizeDictionaryWord(word))
}

function normalizeDictionaryWord(word: string) {
  return word.trim().toUpperCase()
}
