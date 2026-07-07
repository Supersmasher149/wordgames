import rawLevels from './levels.json'
import type { Level } from '../game/types'
import { validateLevels } from '../game/levelValidation'

export const levels = rawLevels as Level[]
const validationIssues = validateLevels(levels)

if (validationIssues.length > 0) {
  throw new Error(
    `Invalid level data:\n${validationIssues
      .map((issue) => `Level ${issue.levelId}: ${issue.message}`)
      .join('\n')}`,
  )
}
