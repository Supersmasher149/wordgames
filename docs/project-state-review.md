# Project State Review

## What's Complete ✅

- **Core Gameplay** — Letter wheel (drag + tap), crossword grid, word submission, feedback animations, hints, shuffle. Fully functional and polished.
- **210 Levels** (5 packs: 50/50/50/25/25) with unique IDs, validated by CLI
- **Auto Grid Solver** — Places required words into crossword layouts automatically
- **Bonus Discovery** — Discovers formable words from the dictionary per level
- **Persistence** — Versioned localStorage (v2), v1→v2 migration, JSON export/import, reset
- **PWA Shell** — Service worker (cache-first, offline fallback), manifest, SVG icons
- **Cat Theme** — Complete SVG asset set (decor, icons), animations, responsive portrait-first layout, `prefers-reduced-motion` support
- **Level Editor** — Built-in tool for creating/testing levels
- **Coin Economy** — Earn coins for words (5) and level completion (25), spend on hints (10)
- **Pack Progression** — Unlock next pack when current pack is completed
- **Settings** — Mute, export/import save, reset, level editor toggle

## What's Incomplete / Issues ⚠️

| Issue | Detail |
|---|---|
| No actual audio | `sound.ts` dispatches events but nothing listens. Zero sound plays anywhere. |
| `hasNextLevel` always `true` | `GameScreen.tsx:283` hardcodes `hasNextLevel={true}`, so "Next Level" button appears after the very last level (210) but does nothing. |
| Legacy `App.css` | 184-line unused stylesheet (old Vite boilerplate), never imported. Dead weight. |
| Brand naming mismatch | README/docs reference "Word Grove"; sound events use `word-grove-sound`. App UI says "Word Paws". |
| Empty dirs | `.github/workflows/` and `scripts/` exist but are empty. |

## Missing for a Polished PWA 🏆

### PWA-specific
| Feature | Why |
|---|---|
| Install prompt | No `beforeinstallprompt` handler — users can't easily install the app |
| SW update notification | New SW activates immediately via `skipWaiting()` but user gets no "update ready" prompt to refresh |
| Splash screen | `manifest.webmanifest` lacks `description`, `screenshots`, proper `background_color` for OS splash |

### Gameplay / UX
| Feature | Why |
|---|---|
| Keyboard input | Desktop users can't type words with a physical keyboard — mobile-only interaction pattern |
| Screen transitions | No animations when switching between level select ↔ game screen |
| Tutorial/onboarding | First-time users get no explanation of how the wheel, hints, or coins work |
| Statistics dashboard | No aggregate stats (total words found, accuracy, hints used, time played) |
| Level review | After completing a level, you can't see what words you found or what you missed |
| Dark mode | No theme toggle — the cream/light palette is fixed |

### Robustness
| Feature | Why |
|---|---|
| Error boundary | If any component crashes, the entire app goes blank with no recovery |
| Loading state | No skeleton/loading UI (minor — data is synchronous, but good practice) |
| Accessibility | Level select grid uses only color for completion status; no keyboard navigation for level cards beyond basic tab; screen reader testing gap |

### Nice-to-haves
| Feature | Why |
|---|---|
| Haptic feedback | Vibration API on mobile for word submit/hint/error |
| Achievements | Milestone rewards (100 words, all beginner pack, etc.) |
| Share results | Share level completion on social media |
