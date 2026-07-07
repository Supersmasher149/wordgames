import type { PackDefinition } from '../../game/types.ts'
import { PACK_IDS } from './_utils.ts'
import { beginnerPack } from './beginnerPack.ts'
import { easyPack } from './easyPack.ts'
import { mediumPack } from './mediumPack.ts'
import { hardPack } from './hardPack.ts'
import { expertPack } from './expertPack.ts'

export const PACKS: PackDefinition[] = [
  {
    pack: {
      id: PACK_IDS.BEGINNER,
      displayName: 'Beginner Pack',
      description: 'Gentle introduction to word puzzles.',
      difficulty: 'beginner',
    },
    levels: beginnerPack,
  },
  {
    pack: {
      id: PACK_IDS.EASY,
      displayName: 'Easy Pack',
      description: 'Build your word skills.',
      difficulty: 'easy',
    },
    levels: easyPack,
  },
  {
    pack: {
      id: PACK_IDS.MEDIUM,
      displayName: 'Medium Pack',
      description: 'Test your vocabulary.',
      difficulty: 'medium',
    },
    levels: mediumPack,
  },
  {
    pack: {
      id: PACK_IDS.HARD,
      displayName: 'Hard Pack',
      description: 'Challenge your mind.',
      difficulty: 'hard',
    },
    levels: hardPack,
  },
  {
    pack: {
      id: PACK_IDS.EXPERT,
      displayName: 'Expert Pack',
      description: 'For word masters only.',
      difficulty: 'expert',
    },
    levels: expertPack,
  },
]
