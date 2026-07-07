# Word Paws

Word Paws is a cozy cat-themed offline-first Wordscapes-style word puzzle game. Connect letters in a circular wheel to fill a crossword-style grid, find bonus words, use hints, shuffle letters, unlock packs, and save progress locally.

## Features

- Responsive React + Vite + TypeScript web app (PWA).
- Mouse, touch, and tap-to-select letter wheel controls.
- Crossword answer grid with animated fills and hints.
- 210 levels across 5 packs (beginner, easy, medium, hard, expert).
- Local dictionary in `src/data/dictionary.json`.
- Auto-solved crossword layouts and dynamic bonus word discovery.
- Coins, shuffle, hints, level completion reward, and pack progression.
- Versioned progress saved in `localStorage` with JSON export/import.
- Installable PWA with offline play after first load.
- Cat-themed visuals: paw prints, yarn ball wheel, cat ears decor, confetti celebration.

## Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (served at `/wordgames/`).

## Build

```bash
npm run build
npm run preview
```

The service worker only registers in the production build. To test install/offline behavior, run `npm run build`, serve the built app with `npm run preview`, open it once online, then reload while offline.

## Validate Levels

```bash
npm run validate-levels
```

Checks all packs for unique IDs, valid letters, spellable words, dictionary membership, grid solvability, and bonus word discovery.

## Offline Notes

- The game does not call external APIs and does not require login, accounts, ads, or a backend.
- All level data, dictionary, and save handling are fully local.
- PWA metadata lives in `public/manifest.webmanifest`; SVG icons live in `public/`.
- Offline caching lives in `public/sw.js`; registration is in `src/registerServiceWorker.ts`.

## Project Structure

```text
src/
  components/        React UI components (GameScreen, LetterWheel, CrosswordGrid, LevelSelect, etc.)
  data/
    dictionary.json  Local dictionary
    packs/           Level pack definitions (beginner, easy, medium, hard, expert)
  engine/
    gridSolver.ts    Auto-layout crossword solver
  game/
    puzzleEngine.ts  Submission evaluation, grid building, hints
    persistence.ts   Versioned localStorage with export/import
    bonusDiscovery.ts Dynamic bonus word discovery from dictionary
    sound.ts         Sound event hook
    types.ts         Shared type definitions
  app-cli/
    validate-levels.node.mts  CLI level validator
  App.tsx            App shell, navigation, and settings wiring
  index.css          Responsive visual system and animations
public/
  manifest.webmanifest  PWA install metadata
  sw.js                Offline service worker
```

## Level Format

```ts
{
  id: 11,
  title: 'Lake Mist',
  letters: ['L', 'A', 'K', 'E'],
  requiredWords: ['LAKE', 'LEAK']
}
```

Add more levels by editing the pack files in `src/data/packs/`. Run `npm run validate-levels` after making changes.
