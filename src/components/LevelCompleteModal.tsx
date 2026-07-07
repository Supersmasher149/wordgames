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
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index} className="confetti-particle" style={{ '--particle-index': index } as CSSProperties} />
          ))}
        </div>
        <p className="eyebrow">Pawsome!</p>
        <h2>{title}</h2>
        <p>You cleared the board. A cozy new puzzle awaits.</p>
        <div className="reward-card">Total coins: {coins}</div>
        <div className="modal-actions">
          <button type="button" onClick={onLevels} className="btn-outline">
            Levels
          </button>
          {hasNextLevel && (
            <button className="btn-coral" type="button" onClick={onNext}>
              Next Level
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
