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
        <p className="eyebrow">Puzzle complete</p>
        <h2>{title}</h2>
        <p>You cleared the board and earned a calm little victory.</p>
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
