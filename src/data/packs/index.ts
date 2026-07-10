import type { PackDefinition } from '../../game/types.ts'
import { PACK_IDS } from './_utils.ts'
import { fourLetterPack } from './fourLetterPack.ts'
import { fiveLetterPack } from './fiveLetterPack.ts'
import { sixLetterPack } from './sixLetterPack.ts'
import { sevenLetterPack } from './sevenLetterPack.ts'
import { eightLetterPack } from './eightLetterPack.ts'

export const PACKS: PackDefinition[] = [
  {
    pack: {
      id: PACK_IDS.FOUR_LETTER,
      displayName: 'Kitten Steps',
      description: '4-letter puzzles. Gentle introduction to word puzzling.',
      difficulty: 'beginner',
      letterCount: 4,
    },
    levels: fourLetterPack,
  },
  {
    pack: {
      id: PACK_IDS.FIVE_LETTER,
      displayName: 'Paw Paths',
      description: '5-letter puzzles. Build your word skills.',
      difficulty: 'easy',
      letterCount: 5,
    },
    levels: fiveLetterPack,
  },
  {
    pack: {
      id: PACK_IDS.SIX_LETTER,
      displayName: 'Yarn Trails',
      description: '6-letter puzzles. Test your vocabulary.',
      difficulty: 'medium',
      letterCount: 6,
    },
    levels: sixLetterPack,
  },
  {
    pack: {
      id: PACK_IDS.SEVEN_LETTER,
      displayName: 'Catnap Grove',
      description: '7-letter puzzles. Challenge your mind.',
      difficulty: 'hard',
      letterCount: 7,
    },
    levels: sevenLetterPack,
  },
  {
    pack: {
      id: PACK_IDS.EIGHT_LETTER,
      displayName: 'Moonlit Paws',
      description: '8-letter puzzles. For word masters only.',
      difficulty: 'expert',
      letterCount: 8,
    },
    levels: eightLetterPack,
  },
]
