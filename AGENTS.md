# AGENTS.md

## Commands

- Install: `npm install`
- Dev server: `npm run dev` (Vite, serves at `/wordgames/`)
- Build: `npm run build` runs `tsc -b && vite build`
- Lint: `npm run lint` runs `oxlint`
- Preview: `npm run preview` (Vite preview of production build)
- Validate levels: `npm run validate-levels` (node with `--experimental-strip-types`)
- No test script in `package.json`; use `build + lint` for verification
- Service worker is production-only; use `build + preview` to test offline behavior

## Vite Config

- `vite.config.ts` sets `base: '/wordgames/'` — dev and prod both serve at this subpath
- Service worker registers with `scope: '/wordgames/'` (`src/registerServiceWorker.ts`)

## Architecture Notes

- Entrypoint: `src/main.tsx` → `src/App.tsx` (wires screens, progress, pack/level resolution)
- Level data source of truth: `src/data/packs/*.ts` (5 packs: beginner/easy/medium/hard/expert), NOT JSON
- Each pack is a `readonly LevelData[]` with `{ id, title, letters, requiredWords }` (`src/game/types.ts`)
- `solveGrid()` (`src/engine/gridSolver.ts`) auto-places required words in a crossword on every level load
- Bonus words are discovered dynamically from the letter bag + dictionary (`src/game/bonusDiscovery.ts`)
- Dictionary: `src/data/dictionary.json` loaded as a `Set` via `src/data/dictionary.ts`
- Puzzle engine: `src/game/puzzleEngine.ts` — submission evaluation, grid building, hints
- Persistence: `src/game/persistence.ts` — versioned localStorage (v2) with v1→v2 migration, JSON export/import, reset
- Sound: `src/game/sound.ts` — hook dispatching custom DOM events, no real audio assets
- PWA files: `public/sw.js`, `public/manifest.webmanifest`, `src/registerServiceWorker.ts`
- App is branded as **Word Paws** (cat-themed)

## Level Data Gotchas

- Edit packs in `src/data/packs/*.ts`, not JSON files
- Level IDs must be unique **across all packs** (validated by `npm run validate-levels`)
- Each level requires 4–7 letters, at least 1 required word (min 3 letters each)
- CLI validator checks: letters bound, word spellable, dictionary membership, grid solvability, bonus discovery
- Run `npm run validate-levels` after adding/changing levels; build does not auto-validate
- `requiredWords` alone define the puzzle; the grid solver and bonus discovery are automatic

## Offline/PWA Gotchas

- No external API calls; levels, dictionary, and saves are fully local
- `public/sw.js` caches `/wordgames/` assets on first production load; returns cached `index.html` on offline navigation
- Bump `CACHE_NAME` in `public/sw.js` when cache behavior or core assets change
- Save data has `version: 2`; migrate through `persistence.ts` instead of changing localStorage shape ad hoc

## Mobile Interaction

- `src/index.css` locks page scrolling (`html`, `body`, `#root`, `.app-shell` have `overflow: hidden`)
- `.letter-wheel` and `.wheel-letter` use `touch-action: none` — preserve for drag behavior
- Letter wheel gesture logic is in `src/components/LetterWheel.tsx` (drag-submit + tap select/deselect)

## Styling

- Single global stylesheet: `src/index.css` (no CSS modules or Tailwind)
- Cat-themed palette: teal, pink, gold, cream; cat ears decor on level card and modal; yarn-ball wheel
- Portrait-first responsive layout: crossword above, wheel near bottom, 48px min touch targets on mobile
