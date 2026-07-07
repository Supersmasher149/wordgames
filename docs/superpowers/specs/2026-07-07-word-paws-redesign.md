# Word Paws — Cat-Themed Redesign

## Purpose

Reskin the existing Word Grove / Wordscapes-style word puzzle app into "Word Paws", a cozy cat-café themed word game. No gameplay or backend changes. Fully offline, mobile-first, original SVGs.

## Scope

Visual/UI only. The following are **untouched**:
- `src/game/puzzleEngine.ts` — word validation, grid solving, hint logic
- `src/game/persistence.ts` — localStorage save/load
- `src/game/types.ts` — all type definitions
- `src/data/` — levels.json, dictionary.json, pack data
- `src/engine/` — grid solver algorithm
- `src/app-cli/` — validate-levels CLI tool
- `src/components/LevelEditor.tsx` — kept as-is (dev-only)
- `vite.config.ts`, `tsconfig*.json`, `package.json` — no changes needed

## Color Palette (CSS Variables)

```css
--bg-cream: #fff3e4;
--peach: #ffd8c7;
--pink: #ffaaa0;
--teal: #3aa7a3;
--teal-dark: #237a76;
--gold: #ffc94d;
--card-cream: #fff8ec;
--text-brown: #4a2f24;
--text-muted: #8a6b5b;
--tile-fill: #fffaf0;
--tile-border: #dfb98f;
```

## Typography

```css
font-family: "Nunito", "Quicksand", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
```

No externally hosted fonts. Relies on system fallbacks.

## SVG Assets

All original, simple, scalable SVGs stored in `src/assets/`:

### `src/assets/icons/`
- `cat-face.svg` — circular cat face logo
- `paw.svg` — simple paw print
- `paw-coin.svg` — paw print inside a coin circle
- `fish-bone.svg` — fish skeleton icon
- `bell.svg` — small bell icon
- `book.svg` — open book icon
- `gear.svg` — settings gear
- `shuffle.svg` — shuffle arrows
- `check-paw.svg` — paw with checkmark
- `lightbulb-cat.svg` — lightbulb with cat ears

### `src/assets/decor/`
- `paw-pattern.svg` — scattered paw prints
- `yarn-ball.svg` — yarn ball
- `cat-ears.svg` — cat ears shape
- `cat-tail.svg` — curled cat tail
- `string-lights.svg` — string of lights
- `sleeping-cat.svg` — curled sleeping cat silhouette
- `cat-bed.svg` — cat bed silhouette
- `cat-tree.svg` — cat tree silhouette
- `plant.svg` — potted plant

### `src/assets/ui/`
- `app-icon.svg` — cat face app icon (1024×1024 viewBox)
- `tile-texture.svg` — subtle tile texture
- `yarn-wheel-ring.svg` — decorative yarn wheel ring

## Component Changes

### Header (`App.tsx` via CSS)
- Left: circular cat logo SVG + "Word Paws" text
- Right: cream circular button with gear SVG (SettingsPanel trigger)
- Remove old "WG" brand-mark

### Level Card / Game Topbar (`GameScreen.tsx`)
- Cream card with cat ears pseudo-elements on top edge
- Level number + puzzle title
- "Levels" button with book SVG icon
- Coin pill with paw-coin SVG + coin amount

### Stats Row (`GameScreen.tsx` via CSS)
- Three rounded pills:
  - Words found: fish-bone SVG + count
  - Bonus words: paw SVG + count
  - Hints used: bell SVG + count

### Crossword Grid (`CrosswordGrid.tsx` via CSS)
- Cells: cream tiles with rounded corners, warm shadow, light brown border
- Filled letters: strong brown text
- Found word animation: pop
- Hinted cells: gold glow pulse

### Buttons (`GameScreen.tsx` via CSS)
- **Shuffle**: teal background, shuffle SVG icon
- **Hint**: coral/pink background, lightbulb-cat SVG icon
- **Clear**: teal background, paw SVG icon
- **Enter**: coral/pink background, check-paw SVG icon
- All: pill shape, large touch target, soft shadow, hover/press/disabled states

### Letter Wheel (`LetterWheel.tsx` + CSS)
- Visual redesign only: yarn ring appearance
- Yarn ball SVG in center
- Letters as cream cat-tag discs
- Selected letters glow coral/gold
- Connection path in playful color
- Wheel scales with `clamp()`

### Background Scene (`App.tsx` via CSS)
- Cozy cat room using only CSS gradients and positioned SVG decorations
- Wall: cream/peach gradient
- Floor: slightly darker warm band
- Decorations: sleeping cat, cat tree, plant, string lights, yarn balls, paw prints
- Low contrast — never behind crossword grid
- Desktop: more visible decorations around centered game panel
- Mobile: minimal decorations

### Level Complete Modal (`LevelCompleteModal.tsx`)
- Paw/star confetti burst (instead of current petal)
- Cat-themed text: "Pawsome!" or "Meow-nificent!"
- Coin reward display with paw-coin icon
- "Next Level" and "Levels" buttons in cat theme

### Level Select (`LevelSelect.tsx`)
- Keep structure, apply cat theme colors
- Pack cards use cream cards with cat-ear tops
- Level buttons as rounded cream tiles

## Responsive Breakpoints

Tested at:
- 360×740, 375×667, 390×844, 414×896, 430×932
- Tablet portrait
- Desktop 1440×900

Constraints:
- `100dvh` for full viewport
- `env(safe-area-inset-*)` for notched devices
- `clamp()` for fluid sizing
- No horizontal scroll
- Wheel fully visible without clipping
- Clear/Enter buttons visible
- Shuffle/Hint visible
- Grid fully visible

## Animations

- **Correct word**: tile pop/settle (`popCell`)
- **Invalid word**: shake + flash (`shakeFlash`)
- **Duplicate word**: muted message (no shake)
- **Bonus word**: paw coin sparkle
- **Hint**: golden bell pulse
- **Shuffle**: wheel wiggle/spin
- **Level complete**: paw print / star / yarn confetti

All respect `prefers-reduced-motion: reduce`.

## PWA Updates

- `favicon.svg` → cat face icon
- `manifest.webmanifest` → name/short_name/theme_color updated
- `sw.js` → cache name bumped to `word-paws-offline-v1`
- `icon-192.svg`, `icon-512.svg` → cat face icons

## index.html Updates

- `<title>` → Word Paws
- `<meta name="description">` → cat-themed description
- `<meta name="theme-color">` → `#fff3e4`
- `<meta name="apple-mobile-web-app-title">` → Word Paws

## Files Modified

| File | Change |
|------|--------|
| `index.html` | Branding, title, theme-color |
| `public/favicon.svg` | Cat face icon |
| `public/icon-192.svg` | Cat face icon |
| `public/icon-512.svg` | Cat face icon |
| `public/manifest.webmanifest` | Branding, theme colors |
| `public/sw.js` | Cache name, base path constants |
| `src/index.css` | Full theme rewrite |
| `src/App.tsx` | Header branding, background |
| `src/components/GameScreen.tsx` | Topbar, stats, buttons |
| `src/components/CrosswordGrid.tsx` | Cell classes, optional tweaks |
| `src/components/LetterWheel.tsx` | Visual classes only |
| `src/components/LevelCompleteModal.tsx` | Cat-themed text, confetti |
| `src/components/LevelSelect.tsx` | Theme class updates |
| `src/components/SettingsPanel.tsx` | Gear icon |
| `src/assets/icons/*.svg` | New assets (13 files) |
| `src/assets/decor/*.svg` | New assets (9 files) |
| `src/assets/ui/*.svg` | New assets (3 files) |

## Files NOT Modified

- `src/game/*` — all game logic
- `src/data/*` — all level/pack data
- `src/engine/*` — solver
- `src/app-cli/*` — CLI tools
- `src/registerServiceWorker.ts`
- `vite.config.ts`, `tsconfig*.json`, `package.json`
- `src/components/LevelEditor.tsx`
