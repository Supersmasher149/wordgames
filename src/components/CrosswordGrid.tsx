import type { CSSProperties } from 'react'
import type { Level, LevelProgress } from '../game/types'
import {
  buildGrid,
  getCellKey,
  getPlacementCells,
  normalizeWord,
} from '../game/puzzleEngine'

type CrosswordGridProps = {
  level: Level
  progress: LevelProgress
  recentWord: string | null
}

export function CrosswordGrid({ level, progress, recentWord }: CrosswordGridProps) {
  const grid = buildGrid(level, progress)
  const recentPlacement = level.words.find(
    (placement) => normalizeWord(placement.word) === normalizeWord(recentWord ?? ''),
  )
  const recentCells = new Map(
    recentPlacement
      ? getPlacementCells(recentPlacement).map((cell, index) => [getCellKey(cell), index])
      : [],
  )

  return (
    <section className="crossword-panel" aria-label="Crossword answer grid">
      <div className="crossword-grid">
        {grid.rows.map((row, rowIndex) => (
          <div className="crossword-row" key={`row-${rowIndex}`}>
            {row.map((cell, colIndex) =>
              cell ? (
                <GridCellView
                  cellKey={getCellKey(cell)}
                  fillIndex={recentCells.get(getCellKey(cell))}
                  key={`${cell.row}-${cell.col}`}
                  letter={cell.visible ? cell.letter : ''}
                  className={`grid-cell ${cell.visible ? 'is-visible' : ''} ${
                    cell.filled ? 'is-filled' : ''
                  } ${cell.hinted ? 'is-hinted' : ''}`}
                />
              ) : (
                <div
                  className="grid-cell grid-cell-empty"
                  aria-hidden="true"
                  key={`empty-${rowIndex}-${colIndex}`}
                />
              ),
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

type GridCellViewProps = {
  cellKey: string
  className: string
  fillIndex: number | undefined
  letter: string
}

function GridCellView({ cellKey, className, fillIndex, letter }: GridCellViewProps) {
  const recentStyle =
    fillIndex === undefined
      ? undefined
      : ({ '--fill-index': fillIndex } as CSSProperties)

  return (
    <div
      className={`${className} ${fillIndex === undefined ? '' : 'is-recent'}`}
      data-cell-key={cellKey}
      style={recentStyle}
    >
      <span>{letter}</span>
    </div>
  )
}
