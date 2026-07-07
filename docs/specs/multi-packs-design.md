# Multi-Pack Level System Design Spec

**Purpose:** Refactor the word-puzzle levels into multiple local level packs that expand from 10 hand-authored grids to ~200+ auto-layout-driven levels with a new build-time validation pipeline. All content remains fully offline, no backend or API calls.

---

## Why This Change

1. The game currently ships 10 static hard-coded `Level` objects in JSON — too few for retention.
2. Each current level is defined by fixed grid placements (`WordPlacement[]`) which must be hand-crafted and validated against the puzzle engine. Hard to author at scale.
3. Pack-level progression gating doesn't exist, so there's no way to show "you're 20% through Beginner — try Easy next."
4. Bonus words are manually authored per level; every letter combination never gets its full dictionary coverage automatically.

## Goals (non-negotiable for this design)

- Ship *offline-first* content: levels bundled with the app as TypeScript modules, no backend.
- Add 5 level packs totaling 200 new authorable levels (Beginner 50 / Easy 50 / Medium 50 / Hard 25 / Expert 25).
- Each pack's data is *pure* `letters[]` + `requiredWords[]`; a greedy grid solver produces placements at runtime.
- Build-time validator that auto-solves every new level to confirm it fits the heuristic and rejects levels whose geometry is impossible.
- Auto-discover dictionary-valid anagram bonuses per level via build-time scan; no hand-curated bonus lists (the data schema still allows manual bonus overrides as a future hook).
- New multi-pack progression model in `PlayerProgress` with pack-level unlock gates replacing the flat numeric ID list of levels.

## Audience

Developer building new content or extending the puzzle engine — not end user. This spec guides the implementation, not game UX copy.

---

## Architecture Overview (4 layers)

The new system is organized into four horizontal layers:

1. **Data layer** (`src/data/packs/*.ts`). Pure TypeScript modules holding a `PackDefinition` — one file per pack (~20 KB each, 5 total). Each level is authored as `{letters, requiredWords}` tuple only; no grid coordinates shipped with data.
2. **Types & validation contract** (`src/game/types.ts`). New public types: `LevelData`, `ComputationPlacement`, `PackDefinition`, `Difficulty`. Validation issues use a rich `{severity, suggestion, ...}` shape instead of bare strings.
3. **Engine layer**. New files split out from `puzzleEngine.ts`:
   - `src/engine/gridSolver.ts` — greedy auto-layout solver run at build time for validation and lazily once at game start. No user-facing state mutations.
   - `src/game/bonusDiscovery.ts` — build-time scan of each level's letter bag against the dictionary to discover bonus words automatically (deduped from required list).
4. **Game layer**. `puzzleEngine.ts` is updated to operate on the new raw data shape rather than on hardcoded placements. The validator (`levelValidation.ts`) orchestrates structural → discovery → placement validation pipeline.

---

## Data Types & Schema

*Every new public type lives in `src/game/types.ts`, re-exported by existing files.*

```typescript
export interface WordPlacement {
  word: string
  row: number          // cell origin on the grid (0-indexed)
  col: number
  direction: 'across' | 'down'
}
// ComputedPlacement is an internal alias for runtime use only — 
// the engine may rename this, but it must never ship with level data.

export interface LevelData {
  id: number               // globally-unique across packs; author assigned
  title: string            // shown in-level-select as "Level X" subtitle
  letters: string[]        // 4–7 base anagram letters (author-provided)
  requiredWords: string[]  // 3+ letter words formable from letters; engine auto-layouts them at runtime
}

export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert'

export interface LevelPack {
  id: string                   // e.g. 'BEGINNER', used as gate key in progress
  displayName: string          // shown to player ("Beginner Pack")
  description: string          // optional subtitle rendered inline
  difficulty: Difficulty       // used for progress bar coloring / display badge
}

export interface PackDefinition {
  pack:   LevelPack
  levels: readonly LevelData[]     // immutable; each level has no grid placements shipped
}

// Validation issue shape — replaces any bare-string errors.
export type ValidationSeverity = 'error' | 'warning' | 'info'

export interface ValidationIssue {
  severity: ValidationSeverity
  packId: string
  levelIndex: number               // index in the containing pack for clear console output
  message: string                  // plain English description of what went wrong
  suggestion?: string              // how to fix if obvious (optional)
}

export type ValidationResult =
  | { kind: 'pass' }
  | { kind: 'fail'; issues: ValidationIssue[] }

// LevelPackProgress is the *per-pack* data we carry in PlayerProgress.
export interface PackCompletion {
  completedLevelIds: number[]   // list of level ids done within this pack (max 100%)
}
```

### Updated `PlayerProgress` (in current `src/game/types.ts`)

We migrate *away from* the flat numeric ID arrays (`unlockedLevelIds`, `completedLevelIds`). New shape:

```typescript
export interface PlayerProgress {
  version: number                  // bumped every schema change → triggers migrations in persistence.ts
  currentPackId: string            // which pack is currently active (for level-select highlight)
  currentLevelIndex: number        // 0-based index within the *active* pack's levels[]
  packsUnlocked: Record<string, boolean>   // gate key by PACK ID — NOT per-level
  packsCompleted:   Record<string, number> // count of completed levels / total in each pack
  coins:            number
  usedHints:        number
  settings:         PlayerSettings    // unchanged
}
```

**Migration rule:** When `version` in saved data doesn't match the latest schema — the persistence module runs migration functions one at a time (in version order) until it reaches the current shape. This prevents hard-curdling legacy state and keeps saves portable across app updates.

### Backward compatibility / deprecated types still referenced today

- `GameScreen.currentLevelId` prop now accepts level id *or* index within pack — we pass whichever is clearer from context (`startLevel()` helper in App normalizes it).
- `LetterWheel.tsx`, `CrosswordGrid.tsx` stay unchanged; both already accept a raw-level object and don't need to know about pack structure.

### Summary: new file layout

```
src/                         # existing root
  data/                      # keeps dictionary.json (unchanged) — old levels.ts/lvl JSON deprecated
src/engine/gridSolver.mts                 NEW greedy auto-layout solver for validation only
src/game/bonusDiscovery.ts                NEW build-time anagram bonus discovery
src/data/packs/*.ts                       FIVE new pack modules (~20 KB total)
src/app-cli/validate-levels.node.js       CLI entry script (runs via npm run) — validates ALL packs
```

---

## Grid Solver Engine (Greedy Auto-Layout)

This is the central engine addition. It runs **at build time** to validate every new level's geometry, and also at *game start* so a fresh layout can be computed from `LevelData`. Author does not ship grid coordinates with packs — they're produced deterministically by this solver at both times (so each player sees same grid within a pack).

### Export API

```typescript
// Returns ComputedPlacement[] on success; null if no valid auto-layout was reachable.
export function solveGrid(letters: string[], requiredWords: string[]): WordPlacement[] | null { /* impl */ }
```

The output shape matches existing `WordPlacement[]` so puzzle engine integration requires only one adapter layer (not a full redesign).

### Algorithm — greedy placement heuristic

1. **Anchor the longest word first.** Sort `requiredWords` by descending length; place anchor (longest) horizontally at row 0, column `Math.floor(longestLen / 2)` to give room for crossings on both sides. Mark those cells filled with their letters.
2. **Iterate over remaining required words in order of length.** For each:
   a. Find all valid *crossing positions* — scan the full grid; find any cell where a letter matches between the candidate word and *any already-anchored* word at an intersection point, computed for both "across" and "down" orientations from that cell.
   b. For each candidate orientation around shared anchor: check that cells are empty within 8×8 grid bounds AND that any *collision with a different letter* is rejected (must not overwrite existing valid placements).
   c. Keep candidate if no collision — else discard and try next placement or word order (but keep deterministic by always preferring "across" when possible for visual consistency, breaking ties by the smallest row first so layout is reproducible across runs).
3. **Score candidates and place.** For each valid candidate: score = `+2 × (new cells added - adjacent-to-empty-cells)` (reward dense packing, penalize spreading out too far from center cluster) — pick best-scoring placement at that iteration; write into grid; mark its cells as filled with required letters.
4. **Re-wrap at end.** Find the minimum used row/column and re-base so top-left is `(0, 0)` in the resulting `WordPlacement[]` output. This normalizes layouts from being anchor-position-dependent to a stable origin.

### Solver bounds (failure modes)

- Hard cap: grid max dimension **8 × 8**. If any required word's length > 8 → immediate validator failure with actionable error.
- If more than ~70 words can't cross in current heuristic order → return null so validator flags it "unreachable layout" — author should split that pack into two or reduce letter set (not a hard rule but informs what *feels* achievable).

### Engine integration: `buildLayoutFromData(level?: LevelData): WordPlacement[] | null`

A thin adapter layer between this solver and the existing puzzle engine. It runs the solver, returns placements, then composes them into whatever grid view the renderer needs — this is so `puzzleEngine.ts` doesn't need to be re-architected for placement-vs-data separation (minimal refactor). The current hardcoded-grid path (`buildGrid`) stays as deprecated fallback: removed in a future PR once all existing 10 levels migrate.

---

## Level Data Organization & Validation Pipeline

### File layout (the `data/packs/` folder)

```
src/data/packs/                          NEW folder — one module / pack (plus helpers)
 ├── _utils.ts                            Helper type aliases + common validation rules for pack authors; not exported to runtime
 ├── beginnerPack.ts                      50 levels, simple vowels/consonants and 3-4 letter words
 ├── easyPack.ts
 ├── mediumPack.ts
 ├── hardPack.ts                          Hard + expert share the same "dense" heuristic but harder letters & shorter time (future) — keep layout consistent with each pack's difficulty label for consistency
 └── expertPack.ts
index.ts                                 Re-exports all PackDefinition as const PACKS: readonly PackDefinition[]; used by App.tsx only.
```

Each pack module has exactly two exported symbols per the spec: `const LEVELS: LevelData[]` and an optional `export async function validateThis()`.

### Authoring examples (what a level looks like)

```typescript
// Inside beginnerPack.ts, each entry is one puzzle:
{ id: 1, title: 'Lake Mist', letters: ['L','A','K','E'], requiredWords: ['LAKE', 'LEAK', 'ELK'] }
{ id: 2, title: 'Pond Path', letters: ['P','O','N','D'],    requiredWords: ['POND', 'POD', 'NOD', 'DON'] }
// ... etc for each pack's levels
```

### Validation pipeline run at build time (`validate-all` flow)

The script runs the *entire pipeline* in order and short-circuits a level validation if structural errors exist (so expensive solver doesn't run on obviously invalid data). Output is console-friendly with `error | warning | info` severity labels.

Order of checks per pack (cheapest first):
1. **Pack-level**: each pack id unique across entire game; required words length <= letters.length; every char in requiredWords comes from available letters (else fails fast — no need to run solver if impossible).
2. **Per level structural check** (still cheap vs solver): dedupe across `requiredWords`; bonus-only cross-list deduplication is handled by bonusDiscovery (post-validation) — but we still warn when a user manually-supplied bonus matches an existing required word.
3. **Solver**: run `solveGrid` per level; on null result, validator flags the offending word with *suggestion* "try removing this word or reorder letter bag so it can be placed"; no longer fails validation because of one hard-failed layout — instead emits a `warning` that shows in build logs but doesn't block compilation (this way we let authors iteratively debug).
4. **Cross-list bonus discover**: run `discoverAllValidBonusWords` for each completed pack; return the merged list deduped against required words and existing manual bonuses (so no surprise overwriting of curated lists even if user did author one manually). 

### CLI interface & npm script

New entry: `npm run validate-levels`. Run from project root — executes a Node.js process running our validator.

- **Script file:** `src/app-cli/validate-levels.node.mjs` is the executable; it imports `levelValidation` once per pack and prints results to stdout with ANSI terminal coloring so errors are visually distinct.
- **Exit codes:** 0 = passes all validation (no warnings emitted). 1 = any error severity. 3 for structural warning only (non-blocking but visible) — useful in CI as a lint-style gate.

---

## Progression & Unlocks (per-packer gating)

### Pack-by-pack unlock rule

A new pack becomes reachable **only when the previous one is fully completed** (so a player must finish Beginner → Easy → Medium → Hard → Expert in strict order). This matches Wordscape's "level 50 = pack B" pattern.

- The *progress bar* on each pack's display shows `<completed> / <total>` count inside its badge; the next pack is grayed out with a "(complete {N} levels first)" label to drive completion motivation ("almost there" hook).
- A "current within-pack" state highlights where in the pack you're playing — useful for returning players.

### Save schema migration (in `persistence.ts`)

When version mismatch detected: run `migrateFromV{N}` chain until reaching current. Existing PlayerProgress had flat arrays of numeric level ids; we convert them to per-pack counters with a lookup table derived from known pack files so the same save data keeps working across versions (no "start over" forced on users when adding packs).

---

## UI / Component Impact & Level Select Redesign

### New pack selector component(s) — splits current `LevelSelect` into two

Two new sub-components plus a wrapper:
- `PackList.tsx`: vertical scroll of pack cards; only one *expanded* at a time on mobile (default collapsed), all visible stacked in desktop view. Each card shows `<pack-display-name> · <difficulty-badge> · completed count / total`.
- `LevelCard.tsx`: nested inside each expanded pack section. Shows `<level-title>` with an inner status badge ("Completed ✓", "Current ⏎", "unlocked" text), clickable — launches GameScreen for that level id.

### Layout notes on current component refactor (existing: LevelSelect.tsx)
- The current single-file implementation becomes the `PackList`. The *inner* expanded section is now `LevelCard` with state tracking which level was last clicked so we can show `Current` indicator (vs. what's actually in progress).
- `GameScreen.currentLevelId` prop accepts either id or index; App.tsx passes whichever makes most sense — no breakage on old code path. Same for LevelSelect: it calls GameScreen.startLevel with normalized level id so the existing state flow continues to work unchanged by UI refactor.

---

## File Manifest (new vs. updated, grouped)

| Direction     | File                                                         | Purpose                                       |
|---------------|--------------------------------------------------------------|-----------------------------------------------|
| **NEW**       | `src/engine/gridSolver.mts`                                  | Greedy auto-layout solver for validation only |
| **NEW**       | `src/game/bonusDiscovery.ts`                                | Build-time anagram bonus discovery            |
| **NEW**       | `src/data/packs/_utils.ts`                                     | Helper type aliases / shared authoring rules  |
| **NEW**       | `src/data/packs/beginnerPack.ts`                               | Beginner pack (50 levels)                       |
| **NEW**       | `src/data/packs/easyPack.ts`                                   | Easy pack (50 levels)                           |
| **NEW**       | `src/data/packs/mediumPack.ts`                                 | Medium pack (50 levels)                         |
| **NEW**       | `src/data/packs/hardPack.ts`                                  | Hard pack (25 levels)                          |
| **NEW**       | `src/data/packs/expertPack.ts`                               | Expert pack (25 levels)                       |
| **NEW**       | `src/app-cli/validate-levels.node.mjs`                    | CLI entry for level validation                |
| Updated     | Existing `package.json`                                   | Add `validate-levels` script                   |
| Updated     | `src/game/persistence.ts`                                  | Persist new schema; handle migration             |
| Updated     | `src/App.tsx`                                              | Use packs model                                |
| Refactor    | Existing `GameScreen.tsx`, `LevelSelect.tsx`, etc.         | Adapt to new shape                              |

---

## Offline-First Guarantee (non-negotiable)

Every level data is static — compiled at build time into app bundle or emitted as JSON asset files; nothing is fetched at runtime. No API calls for levels, dictionary, progress, or any other source of truth. All word discovery and validation is local-only: the dictionary lookup uses `dictionary.json` which ships with the project alongside level pack modules (not loaded from CDN).

---

## Verification Approach

After implementation we will run all 5 test paths in `npm run validate-levels`: Beginner/Easy/Medium/Hard/Expert each validates cleanly, no issues or warnings. Then add a *sanity-test* step that loads a real level through the puzzle engine and verifies:
- letters are discoverable in grid cells (no dead cells in placement list);
- every word listed as `requiredWords` appears somewhere on grid;

Both verification steps run pre-commit via git hook or CI if present.

---

## Future Hooks (not part of this spec but referenced)

These items were *intentionally* deferred to keep scope contained. Each is explicitly **out-of-scope for this PR**:
- Per-level time limit / difficulty badge shown in level-card UI
- Hint system that uses discovered-but-not-found bonuses (bonusDiscovery could be extended to track "discovered but not used bonus words" for a hint flow)
- Online leaderboards, multiplayer sessions, social sharing — explicitly prohibited by offline-first design

---

*Spec end.* End-user documentation is the responsibility of the next section; this file only describes what *developers building or extending content should know about*. The implementation phase will handle how to expose all of this in UI to players.