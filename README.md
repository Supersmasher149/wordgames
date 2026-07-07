# Word Grove

Word Grove is an original Wordscapes-style word puzzle prototype. Players connect letters in a circular wheel to fill a crossword-style grid, find bonus words, use hints, shuffle letters, unlock levels, and save progress locally.

## Features

- Responsive React + Vite + TypeScript web app.
- Mouse, touch, and tap-to-select letter wheel controls.
- Crossword answer grid with animated fills and hints.
- 10 original playable sample levels in `src/data/levels.ts`.
- Bonus words, coins, shuffle, hints, level completion, and level select.
- Progress saved in `localStorage`.
- Sound hook placeholder in `src/game/sound.ts`; sound can be muted in settings.
- Lightweight web manifest for future PWA/mobile wrapping.

## Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```text
src/
  components/        React UI components
  data/levels.json   JSON level definitions
  data/levels.ts     Typed level export
  game/              Puzzle engine, persistence, sound hooks, and types
  App.tsx            App shell, navigation, and settings wiring
  index.css          Responsive visual system and animations
```

## Level Format

```ts
{
  id: 1,
  title: 'Lake Mist',
  letters: ['L', 'A', 'K', 'E'],
  words: [
    { word: 'LAKE', row: 2, col: 0, direction: 'across' },
    { word: 'LEAK', row: 2, col: 0, direction: 'down' },
  ],
  bonusWords: ['KALE', 'LEA']
}
```

Add more levels by appending objects with the same shape to `src/data/levels.json`.
