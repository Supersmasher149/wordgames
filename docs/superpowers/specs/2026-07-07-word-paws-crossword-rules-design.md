# Word Paws — Strict Crossword Puzzle System

## Overview

Redefine Word Paws puzzle rules to behave like a polished Wordscapes-style word puzzle game. Eliminate confusing fake-word runs on the crossword grid by enforcing strict placement, boundary, and adjacency rules. Add a controlled difficulty model, comprehensive level validation, and a robust grid solver.

## Goals

- Every required word has an explicit, validated crossword slot
- No accidental fake words appear on the grid
- Bonus words are optional and don't appear on the grid
- Difficulty scales fairly across 5 tiers
- Level validator catches layout problems before release

## Non-goals

- No backend, accounts, ads, or external APIs
- No copying Wordscapes branding, levels, UI, assets, or names
- No storing placements or bonus words in source data (computed at runtime)

## Type changes

### `src/game/types.ts`

- Rename `Direction` from `'across' | 'down'` to `'horizontal' | 'vertical'`
- Add `WordDirection` as an alias for the same union
- `WordPlacement` uses the new direction values
- `LevelData` gains `difficulty?: Difficulty` (per-level override, defaults to pack difficulty)
- `LevelData` stays without `placements` or `bonusWords` — these are computed at runtime
- `Level` (runtime) keeps `words: WordPlacement[]` and `bonusWords: string[]`

## Grid solver rewrite

### `src/engine/gridSolver.ts`

Complete rewrite with strict rules:

1. **Slot boundary rules** — For each horizontal word, the cell before the first letter and after the last letter must be empty/out-of-bounds. Same vertically (above/below).

2. **Adjacent cell rules** — For each horizontal word letter, cells above and below must be empty unless they belong to a valid vertical crossing. For each vertical word letter, cells left and right must be empty unless they belong to a valid horizontal crossing.

3. **Full-grid scan** — After placing all words, scan every horizontal and vertical run of 2+ letters. Every run must match exactly one required word placement. If any run doesn't, the layout is invalid.

4. **Crossing rules** — Words may only connect by sharing a cell with the same letter. Two words cannot touch side-by-side, continue into each other, or be adjacent in a way that creates a longer accidental run.

5. **Connectedness strategy** — Place longest word first. Try crossings with existing words at matching letters. If no valid crossing exists, place as a separated island (min 1 empty row/col gap). Never force a bad connection.

6. **Dynamic grid** — Use a large virtual grid (16×16), place words, then trim unused rows/columns and center the final result.

7. **Failure** — If a word cannot be placed under any strategy, return `null`.

## Level validator

### `src/app-cli/validate-levels.node.mts`

Keep existing checks, add comprehensive post-placement validation:

- Unique level IDs across all packs
- Valid letter count (4–7)
- Words ≥ 3 letters, spellable from letters, in dictionary
- No duplicate required or bonus words
- Solver produces a non-null result
- Every required word has exactly one placement
- Placement letters match the word
- Crossing letters match at shared cells
- No invalid side adjacency (non-crossing neighbors)
- No invalid before/after adjacency (slot boundary violation)
- Full-grid scan: every 2+ letter contiguous run matches a required placement
- Grid trims/centers safely
- At least one bonus word discoverable (warning)
- Difficulty tier check (number of words/letters vs expected range)

Error messages include exact location of fake runs:

> "Level lake-mist-11 creates unintended horizontal run LAKES at row 4 col 2. This run is not a required word placement. Add spacing or change placements."

## Difficulty model

5 tiers applied per-level (defaults to pack difficulty):

| Tier | Letters | Required words | Word length | Crossings |
|------|---------|----------------|-------------|-----------|
| Beginner | 3-4 | 3-5 | 3-4 | Generous |
| Easy | 4-5 | 4-7 | 3-5 | Moderate |
| Medium | 5-6 | 6-10 | 3-6 | Moderate |
| Hard | 6-7 | 8-14 | 3-7 | Sparse |
| Expert | 7 | 10-18 | 3-7 | Challenging |

## Existing level fixes

Run validator against all 210 levels. For invalid levels:
- Adjust word sets to allow valid crossings
- Remove or replace words that can't be placed
- Keep same answer words when possible
- Don't delete levels unless absolutely necessary

## Implementation order

1. Update types (`Direction` → `horizontal`/`vertical`, `difficulty` on `LevelData`)
2. Rewrite grid solver with strict rules
3. Update puzzle engine and components for new Direction values
4. Rewrite validator with full-grid scan
5. Run validator against all levels, fix failures
6. Build + lint verification
7. Manual testing of gameplay

## Validation

- `npm run validate-levels` must pass with zero errors
- `npm run build` must succeed
- `npm run lint` must pass
