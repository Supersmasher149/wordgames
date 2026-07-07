# AGENTS.md

## Commands

- Install: `npm install`.
- Dev server: `npm run dev`.
- Production verification: `npm run build` runs `tsc -b && vite build`.
- Lint: `npm run lint` runs `oxlint`.
- There is no test script in `package.json`; use `npm run build` plus `npm run lint` for current verification.
- Service worker registration is production-only; use `npm run build` plus `npm run preview` to manually test install/offline behavior.

## Architecture Notes

- App entrypoint is `src/App.tsx`; it wires screen selection, settings, active level, and persisted progress.
- Level data source of truth is `src/data/levels.json`; `src/data/levels.ts` only casts and validates it.
- Dictionary source of truth is `src/data/dictionary.json`; level validation checks required and bonus words against it.
- Puzzle rules live in `src/game/puzzleEngine.ts`; level schema and progress types live in `src/game/types.ts`.
- Progress persistence is versioned client-only localStorage in `src/game/persistence.ts`; it also handles reset and JSON export/import.
- Sound is intentionally just a hook in `src/game/sound.ts`, not real audio assets.
- PWA files are dependency-free: `public/manifest.webmanifest`, `public/sw.js`, and `src/registerServiceWorker.ts`.

## Level Data Gotchas

- Adding or editing levels should be done in `src/data/levels.json`, not in UI components.
- Importing `src/data/levels.ts` runs `validateLevels`; `npm run build` fails on invalid level data.
- Validator catches duplicate words, unavailable letters, invalid placements, grid conflicts, and required words fully hidden by overlap.
- Validator also requires level words to exist in `src/data/dictionary.json`.
- Required words must be independently discoverable in the grid; do not place a required word entirely on top of other required words.

## Offline/PWA Gotchas

- Do not add external API calls for game content; levels, dictionary, and saves are local by design.
- `public/sw.js` caches same-origin production assets after first load and returns cached `index.html` for offline navigation.
- Bump the service worker cache name in `public/sw.js` when changing cache behavior or core public assets.
- Save data has a `version` field; migrate through `src/game/persistence.ts` instead of changing localStorage shape ad hoc.

## Mobile Interaction Gotchas

- `src/index.css` intentionally locks page scrolling (`html`, `body`, `#root`, `.app-shell`) so dragging the letter wheel never moves the page.
- `.letter-wheel` and `.wheel-letter` use `touch-action: none`; preserve this for mobile drag behavior.
- Letter wheel gesture logic is in `src/components/LetterWheel.tsx`; it supports drag-submit plus tap select/deselect fallback.

## Styling Scope

- This app uses one global stylesheet, `src/index.css`; there are no CSS modules or Tailwind config.
- Keep the portrait phone layout primary: crossword readable above, wheel reachable near the bottom, large touch targets.
