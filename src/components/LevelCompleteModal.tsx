import type { CSSProperties } from 'react'

type LevelCompleteModalProps = {
  title: string
  coins: number
  hasNextLevel: boolean
  onNext: () => void
  onLevels: () => void
}

export function LevelCompleteModal({
  title,
  coins,
  hasNextLevel,
  onNext,
  onLevels,
}: LevelCompleteModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="complete-modal" role="dialog" aria-modal="true">
        <div className="celebration-burst" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (
            <span key={index} style={getPetalStyle(index)} />
          ))}
        </div>
        <p className="eyebrow">Puzzle complete</p>
        <h2>{title}</h2>
        <p>You cleared the board. A new grove path is open.</p>
        <div className="reward-card">Total coins: {coins}</div>
        <div className="modal-actions">
          <button type="button" onClick={onLevels}>
            Level Select
          </button>
          {hasNextLevel && (
            <button className="primary" type="button" onClick={onNext}>
              Next Level
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

function getPetalStyle(index: number) {
  return { '--petal-index': index } as CSSProperties
}
