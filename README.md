# Word Grove

Word Grove is an original offline-first Wordscapes-style word puzzle prototype. Players connect letters in a circular wheel to fill a crossword-style grid, find bonus words, use hints, shuffle letters, unlock levels, and save progress locally.

## Features

- Responsive React + Vite + TypeScript web app.
- Mouse, touch, and tap-to-select letter wheel controls.
- Crossword answer grid with animated fills and hints.
- 10 original playable sample levels in `src/data/levels.json`.
- Local dictionary in `src/data/dictionary.json`.
- Bonus words, coins, shuffle, hints, level completion, and level select.
- Versioned progress saved in `localStorage` with JSON export/import.
- Sound hook placeholder in `src/game/sound.ts`; sound can be muted in settings.
- Installable PWA manifest and service worker for offline play after first load.

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

The service worker only registers in the production build. To test install/offline behavior, run `npm run build`, serve the built app with `npm run preview`, open it once online, then reload while offline.

## Offline-First Notes

- The game does not call external APIs and does not require login, accounts, ads, multiplayer, or a backend.
- PWA metadata lives in `public/manifest.webmanifest`; placeholder icons live in `public/favicon.svg`, `public/icon-192.svg`, and `public/icon-512.svg`.
- Offline caching lives in `public/sw.js`; registration is isolated in `src/registerServiceWorker.ts`.
- Levels are local JSON in `src/data/levels.json` and are validated by `src/data/levels.ts` on import.
- Dictionary words are local JSON in `src/data/dictionary.json` and are validated from `src/game/levelValidation.ts`.
- Save loading, sanitizing, versioning, reset, export, and import live in `src/game/persistence.ts`.
- Current save data includes current level, unlocked levels, completed levels, coins, hints used, bonus words found, and sound settings.

## Project Structure

```text
src/
  components/        React UI components
  data/dictionary.json Local dictionary definitions
  data/levels.json   JSON level definitions
  data/levels.ts     Typed level export
  game/              Puzzle engine, persistence, sound hooks, and types
  App.tsx            App shell, navigation, and settings wiring
  index.css          Responsive visual system and animations
public/
  manifest.webmanifest PWA install metadata
  sw.js                Offline service worker
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
