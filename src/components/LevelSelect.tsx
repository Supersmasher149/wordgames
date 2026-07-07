import type { Level } from '../game/types'

type LevelSelectProps = {
  levels: Level[]
  completedLevelIds: number[]
  currentLevelId: number
  onSelectLevel: (levelId: number) => void
}

export function LevelSelect({
  levels,
  completedLevelIds,
  currentLevelId,
  onSelectLevel,
}: LevelSelectProps) {
  const isUnlocked = (levelId: number) => {
    if (levelId === levels[0]?.id) {
      return true
    }

    const previousLevel = levels[levels.findIndex((level) => level.id === levelId) - 1]
    return Boolean(previousLevel && completedLevelIds.includes(previousLevel.id))
  }

  return (
    <section className="level-select">
      <div className="section-heading">
        <p className="eyebrow">Choose a trail</p>
        <h1>Word Grove</h1>
        <p>Unlocked levels stay available, so you can replay any completed puzzle.</p>
      </div>
      <div className="level-list">
        {levels.map((level) => {
          const unlocked = isUnlocked(level.id)
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
