import type { Level, LevelProgress } from '../game/types'
import { buildGrid } from '../game/puzzleEngine'

type CrosswordGridProps = {
  level: Level
  progress: LevelProgress
}

export function CrosswordGrid({ level, progress }: CrosswordGridProps) {
  const grid = buildGrid(level, progress)

  return (
    <section className="crossword-panel" aria-label="Crossword answer grid">
      <div className="crossword-grid">
        {grid.rows.map((row, rowIndex) => (
          <div className="crossword-row" key={`row-${rowIndex}`}>
            {row.map((cell, colIndex) =>
              cell ? (
                <div
                  className={`grid-cell ${cell.visible ? 'is-visible' : ''} ${
                    cell.filled ? 'is-filled' : ''
                  } ${cell.hinted ? 'is-hinted' : ''}`}
                  key={`${cell.row}-${cell.col}`}
                >
                  <span>{cell.visible ? cell.letter : ''}</span>
                </div>
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
