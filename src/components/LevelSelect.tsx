import type { Level } from '../game/types'

type LevelSelectProps = {
  levels: Level[]
  unlockedLevelIds: number[]
  completedLevelIds: number[]
  currentLevelId: number
  onSelectLevel: (levelId: number) => void
}

export function LevelSelect({
  levels,
  unlockedLevelIds,
  completedLevelIds,
  currentLevelId,
  onSelectLevel,
}: LevelSelectProps) {
  return (
    <section className="level-select">
      <div className="section-heading">
        <p className="eyebrow">Choose a trail</p>
        <h1>Word Grove</h1>
        <p>Unlocked levels stay available, so you can replay any completed puzzle.</p>
      </div>
      <div className="level-list">
        {levels.map((level) => {
          const unlocked = unlockedLevelIds.includes(level.id)
          const completed = completedLevelIds.includes(level.id)

          return (
            <button
              className={`level-card ${completed ? 'completed' : ''} ${
                currentLevelId === level.id ? 'current' : ''
              }`}
              disabled={!unlocked}
              key={level.id}
              onClick={() => onSelectLevel(level.id)}
              type="button"
            >
              <span>Level {level.id}</span>
              <strong>{level.title}</strong>
              <small>
                {completed ? 'Completed' : unlocked ? 'Unlocked' : 'Locked'}
              </small>
            </button>
          )
        })}
      </div>
    </section>
  )
}
