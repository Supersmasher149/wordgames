import { useCallback, useMemo, useRef, useState } from 'react'
import type { Direction, Level, WordPlacement } from '../game/types'
import { getCellKey, normalizeWord } from '../game/puzzleEngine'

type EditorWord = {
  word: string
  row: number
  col: number
  direction: Direction
}

type ValidationError = {
  field: string
  message: string
}

type OccupiedCell = {
  letter: string
  wordIndex: number
}

export function LevelEditor({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [lettersRaw, setLettersRaw] = useState('')
  const [bonusWordsRaw, setBonusWordsRaw] = useState('')
  const [words, setWords] = useState<EditorWord[]>([])
  const [nextWord, setNextWord] = useState('')
  const [nextRow, setNextRow] = useState(0)
  const [nextCol, setNextCol] = useState(0)
  const [nextDirection, setNextDirection] = useState<Direction>('across')
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [exportedJson, setExportedJson] = useState('')
  const [importRaw, setImportRaw] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const letters = useMemo(
    () =>
      lettersRaw
        .split(/[,; ]+/)
        .map(normalizeWord)
        .filter(Boolean),
    [lettersRaw],
  )

  const bonusWords = useMemo(
    () =>
      bonusWordsRaw
        .split(/[,; ]+/)
        .map(normalizeWord)
        .filter(Boolean),
    [bonusWordsRaw],
  )

  const occupiedCells = useMemo(() => {
    const map = new Map<string, OccupiedCell>()
    words.forEach((editorWord, wordIndex) => {
      const word = normalizeWord(editorWord.word)
      word.split('').forEach((letter, index) => {
        const row = editorWord.row + (editorWord.direction === 'down' ? index : 0)
        const col = editorWord.col + (editorWord.direction === 'across' ? index : 0)
        const key = getCellKey({ row, col })
        const existing = map.get(key)
        if (existing && existing.letter !== letter) {
          map.set(key, { letter: '@', wordIndex: -1 })
        } else if (!existing) {
          map.set(key, { letter, wordIndex })
        }
      })
    })
    return map
  }, [words])

  const gridBounds = useMemo(() => {
    const bounds = { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 }
    for (const word of words) {
      const len = normalizeWord(word.word).length
      const lastRow = word.row + (word.direction === 'down' ? len - 1 : 0)
      const lastCol = word.col + (word.direction === 'across' ? len - 1 : 0)
      bounds.minRow = Math.min(bounds.minRow, word.row)
      bounds.maxRow = Math.max(bounds.maxRow, lastRow)
      bounds.minCol = Math.min(bounds.minCol, word.col)
      bounds.maxCol = Math.max(bounds.maxCol, lastCol)
    }
    if (bounds.minRow === bounds.maxRow && bounds.minCol === bounds.maxCol) {
      bounds.maxRow += 1
      bounds.maxCol += 1
    }
    return bounds
  }, [words])

  const runValidation = useCallback(() => {
    const result: ValidationError[] = []

    if (!title.trim()) {
      result.push({ field: 'title', message: 'Level title is required.' })
    }

    if (letters.length < 2) {
      result.push({ field: 'letters', message: 'At least 2 available letters are required.' })
    }

    if (words.length === 0) {
      result.push({ field: 'words', message: 'At least one required word is required.' })
    }

    const seenWords = new Set<string>()
    for (const editorWord of words) {
      const word = normalizeWord(editorWord.word)

      if (!word) {
        result.push({ field: 'words', message: 'A required word is empty.' })
        continue
      }

      if (seenWords.has(word)) {
        result.push({ field: 'words', message: `Duplicate required word: ${word}.` })
      }
      seenWords.add(word)

      const letterCounts = new Map<string, number>()
      for (const letter of letters) {
        letterCounts.set(letter, (letterCounts.get(letter) ?? 0) + 1)
      }
      for (const letter of word) {
        const remaining = letterCounts.get(letter) ?? 0
        if (remaining === 0) {
          result.push({ field: 'words', message: `Word ${word} uses unavailable letter "${letter}".` })
          break
        }
        letterCounts.set(letter, remaining - 1)
      }
    }

    setErrors(result)
    return result.length === 0
  }, [title, letters, words])

  const addWord = () => {
    const word = normalizeWord(nextWord)
    if (!word) return
    setWords([...words, { word, row: nextRow, col: nextCol, direction: nextDirection }])
    setNextWord('')
  }

  const removeWord = (index: number) => {
    setWords(words.filter((_, i) => i !== index))
  }

  const handleExport = () => {
    runValidation()
    if (words.length === 0) return
    const level: Level = {
      id: 0,
      title: title.trim() || 'Untitled',
      letters,
      words: words.map((w) => ({
        word: normalizeWord(w.word),
        row: w.row,
        col: w.col,
        direction: w.direction,
      })),
      bonusWords: bonusWords.filter(Boolean).map(normalizeWord),
    }
    const json = JSON.stringify(level, null, 2)
    setExportedJson(json)
  }

  const copyToClipboard = async () => {
    if (!exportedJson) return
    await navigator.clipboard.writeText(exportedJson)
    setImportMessage('Copied to clipboard.')
  }

  const downloadJson = () => {
    if (!exportedJson) return
    const blob = new Blob([exportedJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `level-${title.trim().toLowerCase().replace(/\s+/g, '-') || 'untitled'}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (raw: string) => {
    setImportMessage('')
    try {
      const parsed = JSON.parse(raw)
      if (!parsed.letters || !parsed.words) {
        setImportMessage('Invalid level JSON: missing letters or words.')
        return
      }
      setTitle(parsed.title ?? '')
      setLettersRaw((parsed.letters as string[]).join(', '))
      setBonusWordsRaw((parsed.bonusWords as string[]).join(', '))
      setWords(
        (parsed.words as WordPlacement[]).map((w) => ({
          word: w.word,
          row: w.row,
          col: w.col,
          direction: w.direction,
        })),
      )
      setImportMessage('Level imported successfully.')
    } catch {
      setImportMessage('Invalid JSON format.')
    }
  }

  const handleFileImport = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => handleImport(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  const setPosition = (row: number, col: number) => {
    setNextRow(row)
    setNextCol(col)
  }

  const gridCells: Array<{ row: number; col: number; cell: OccupiedCell | null }> = []
  for (let row = 0; row <= gridBounds.maxRow + 1; row += 1) {
    for (let col = 0; col <= gridBounds.maxCol + 1; col += 1) {
      const key = getCellKey({ row, col })
      gridCells.push({ row, col, cell: occupiedCells.get(key) ?? null })
    }
  }

  return (
    <main className="level-editor">
      <header className="editor-header">
        <h1>Level Editor</h1>
        <button type="button" onClick={onClose}>Back to game</button>
      </header>

      <section className="editor-toolbar">
        <div className="editor-section">
          <h2>Metadata</h2>
          <label>
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
              placeholder="My Puzzle"
            />
          </label>
          <label>
            Available letters
            <input
              value={lettersRaw}
              onChange={(event) => setLettersRaw(event.currentTarget.value)}
              placeholder="L A K E"
            />
          </label>
          <label>
            Bonus words (comma-separated)
            <input
              value={bonusWordsRaw}
              onChange={(event) => setBonusWordsRaw(event.currentTarget.value)}
              placeholder="KALE, LEA"
            />
          </label>
        </div>

        <div className="editor-section">
          <h2>Add word</h2>
          <label>
            Word
            <input
              value={nextWord}
              onChange={(event) => setNextWord(event.currentTarget.value)}
              placeholder="LAKE"
            />
          </label>
          <div className="position-row">
            <label>
              Row
              <input
                type="number"
                min={0}
                value={nextRow}
                onChange={(event) => setPosition(Number(event.currentTarget.value), nextCol)}
              />
            </label>
            <label>
              Col
              <input
                type="number"
                min={0}
                value={nextCol}
                onChange={(event) => setPosition(nextRow, Number(event.currentTarget.value))}
              />
            </label>
            <label>
              Direction
              <select
                value={nextDirection}
                onChange={(event) => setNextDirection(event.currentTarget.value as Direction)}
              >
                <option value="across">Across</option>
                <option value="down">Down</option>
              </select>
            </label>
          </div>
          <button type="button" onClick={addWord}>
            Add word
          </button>
        </div>
      </section>

      <div className="editor-main">
        <section className="editor-grid-section">
          <h2>Grid preview</h2>
          <div className="editor-grid-wrapper">
            <div className="editor-grid">
              {gridCells.map(({ row, col, cell }) => (
                <button
                  className={`editor-grid-cell ${
                    cell ? (cell.letter === '@' ? 'editor-conflict' : 'editor-filled') : 'editor-empty'
                  } ${nextRow === row && nextCol === col ? 'editor-cursor' : ''}`}
                  key={`${row}-${col}`}
                  onClick={() => setPosition(row, col)}
                  type="button"
                >
                  {cell && cell.letter !== '@' ? cell.letter : ''}
                </button>
              ))}
            </div>
          </div>
          <p className="editor-grid-hint">
            Click a cell to set the start position for the next word.
          </p>
        </section>

        <aside className="editor-sidebar">
          <section className="editor-section">
            <h2>Words ({words.length})</h2>
            {words.length === 0 && <p className="editor-muted">No words yet.</p>}
            <ul className="editor-word-list">
              {words.map((editorWord, index) => (
                <li key={index}>
                  <strong>{normalizeWord(editorWord.word)}</strong>
                  <span className="editor-word-meta">
                    ({editorWord.row}, {editorWord.col}) {editorWord.direction === 'across' ? '→' : '↓'}
                  </span>
                  <button type="button" className="editor-remove" onClick={() => removeWord(index)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="editor-section">
            <h2>Letters in wheel</h2>
            <div className="wheel-preview">
              {letters.map((letter, index) => (
                <span className="wheel-preview-letter" key={`${letter}-${index}`}>
                  {letter}
                </span>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <section className="editor-actions">
        <button type="button" onClick={runValidation}>
          Validate
        </button>
        <button type="button" onClick={handleExport}>
          Export JSON
        </button>
      </section>

      {errors.length > 0 && (
        <section className="editor-errors">
          <h2>Validation errors</h2>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </section>
      )}

      {exportedJson && (
        <section className="editor-export">
          <h2>Exported JSON</h2>
          <pre>{exportedJson}</pre>
          <div className="editor-export-actions">
            <button type="button" onClick={copyToClipboard}>
              Copy to clipboard
            </button>
            <button type="button" onClick={downloadJson}>
              Download as file
            </button>
          </div>
        </section>
      )}

      <section className="editor-import">
        <h2>Import JSON</h2>
        <div className="editor-import-row">
          <textarea
            placeholder="Paste level JSON here..."
            value={importRaw}
            onChange={(event) => setImportRaw(event.currentTarget.value)}
            rows={6}
          />
        </div>
        <div className="editor-import-actions">
          <button type="button" onClick={() => handleImport(importRaw)}>
            Import from text
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            Import from file
          </button>
          <input
            accept="application/json,.json"
            ref={fileInputRef}
            type="file"
            className="editor-file-input"
            onChange={(event) => handleFileImport(event.currentTarget.files?.[0])}
          />
        </div>
        {importMessage && <p className="editor-import-message">{importMessage}</p>}
      </section>
    </main>
  )
}
