import { PACKS } from '../data/packs/index.ts'
import type { PlayerProgress } from '../game/types'

type LevelSelectProps = {
  progress: PlayerProgress
  onSelectLevel: (packId: string, levelIndex: number) => void
}

export function LevelSelect({
  progress,
  onSelectLevel,
}: LevelSelectProps) {
  return (
    <section className="level-select">
      <div className="section-heading">
        <p className="eyebrow">Choose a cozy puzzle</p>
        <h1>Word Paws</h1>
        <p>All completed puzzles stay unlocked. Play any time.</p>
      </div>

      <div className="pack-list">
        {PACKS.map((packDef) => {
          const packId = packDef.pack.id
          const unlocked = Boolean(progress.packsUnlocked[packId])
          const completedCount = progress.packsCompleted[packId] ?? 0
          const totalCount = packDef.levels.length
          const allCompleted = completedCount >= totalCount && totalCount > 0

          return (
            <div
              key={packId}
              className={`pack-section ${allCompleted ? 'completed' : ''} ${unlocked ? '' : 'locked'}`}
            >
              <div className="pack-header">
                <h2>{packDef.pack.displayName}</h2>
                <p className="pack-description">{packDef.pack.description}</p>
                <p className="pack-stats">
                  {unlocked
                    ? `${completedCount} / ${totalCount} completed`
                    : 'Locked'}
                </p>
              </div>

              {unlocked && (
                <div className="level-list">
                  {packDef.levels.map((level, index) => {
                    const levelId = level.id
                    const completed = progress.completedLevelIds.includes(levelId)
                    const isCurrent =
                      progress.currentPackId === packId &&
                      progress.currentLevelIndex === index

                    return (
                      <button
                        className={`level-card ${completed ? 'completed' : ''} ${
                          isCurrent ? 'current' : ''
                        }`}
                        key={levelId}
                        onClick={() => onSelectLevel(packId, index)}
                        type="button"
                      >
                        <span>Level {levelId}</span>
                        <strong>{level.title}</strong>
                        <small>
                          {completed ? 'Completed' : 'Unlocked'}
                        </small>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
