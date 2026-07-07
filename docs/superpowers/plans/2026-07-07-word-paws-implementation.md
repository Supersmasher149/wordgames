# Word Paws Redesign Implementation Plan

> **For agentic workers:** Inline execution — tasks execute sequentially in session.

**Goal:** Reskin the Word Grove word puzzle app into a cozy cat-themed "Word Paws" game with original SVGs, CSS theme, and responsive mobile-first layout.

**Architecture:** Pure visual/UI reskin. Game logic (puzzle engine, persistence, level data) untouched. All changes are in `src/index.css`, components, SVG assets, and public PWA files.

**Tech Stack:** React 19, TypeScript 6, Vite 8, CSS variables, inline/imported SVGs.

## Global Constraints

- No external fonts, images, icon libraries, CDNs, or APIs
- Fully offline
- Mobile-first responsive: 360×740 up to 1440×900 desktop
- Use `100dvh`, `env(safe-area-inset-*)`, `clamp()`, CSS variables
- Respect `prefers-reduced-motion: reduce`
- Keep Level Editor as-is (no cat theme)
- All SVGs must be original, simple, scalable

---

### Task 1: Create SVG asset files

**Files:** Create 25 SVG files under `src/assets/icons/`, `src/assets/decor/`, `src/assets/ui/`

**Interfaces:** All SVGs are `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"`. Used via inline `dangerouslySetInnerHTML` or React component wrappers.

- [ ] **Step 1:** Create `src/assets/icons/cat-face.svg` — circular cat face logo

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="30" fill="#3aa7a3"/>
  <path d="M16 20 Q12 10 20 16 Q18 8 26 16" fill="#237a76"/>
  <path d="M48 20 Q52 10 44 16 Q46 8 38 16" fill="#237a76"/>
  <ellipse cx="22" cy="30" rx="4" ry="3.5" fill="#fff"/>
  <ellipse cx="42" cy="30" rx="4" ry="3.5" fill="#fff"/>
  <circle cx="24" cy="30" r="2" fill="#4a2f24"/>
  <circle cx="40" cy="30" r="2" fill="#4a2f24"/>
  <ellipse cx="32" cy="38" rx="2" ry="1.2" fill="#ffaaa0"/>
  <path d="M24 44 Q32 52 40 44" fill="none" stroke="#237a76" stroke-width="2" stroke-linecap="round"/>
  <circle cx="17" cy="28" r="1.5" fill="#fff"/>
  <circle cx="47" cy="28" r="1.5" fill="#fff"/>
</svg>
```

- [ ] **Step 2:** Create `src/assets/icons/paw.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="18" cy="26" r="7" fill="#ffaaa0"/>
  <circle cx="46" cy="26" r="7" fill="#ffaaa0"/>
  <circle cx="10" cy="40" r="7" fill="#ffaaa0"/>
  <circle cx="54" cy="40" r="7" fill="#ffaaa0"/>
  <ellipse cx="32" cy="44" rx="16" ry="11" fill="#ffaaa0"/>
</svg>
```

- [ ] **Step 3:** Create `src/assets/icons/paw-coin.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="29" fill="#ffc94d" stroke="#e0a800" stroke-width="2"/>
  <circle cx="32" cy="32" r="24" fill="#ffdb7a"/>
  <circle cx="22" cy="27" r="5" fill="#ffaaa0"/>
  <circle cx="42" cy="27" r="5" fill="#ffaaa0"/>
  <ellipse cx="32" cy="39" rx="11" ry="8" fill="#ffaaa0"/>
</svg>
```

- [ ] **Step 4:** Create `src/assets/icons/fish-bone.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M6 32 L58 32" stroke="#8a6b5b" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M16 14 L22 32 L16 50" fill="none" stroke="#8a6b5b" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="12" cy="32" r="4" fill="#8a6b5b"/>
  <line x1="26" y1="22" x2="30" y2="22" stroke="#8a6b5b" stroke-width="2" stroke-linecap="round"/>
  <line x1="26" y1="42" x2="30" y2="42" stroke="#8a6b5b" stroke-width="2" stroke-linecap="round"/>
  <line x1="34" y1="22" x2="38" y2="22" stroke="#8a6b5b" stroke-width="2" stroke-linecap="round"/>
  <line x1="34" y1="42" x2="38" y2="42" stroke="#8a6b5b" stroke-width="2" stroke-linecap="round"/>
  <line x1="42" y1="22" x2="46" y2="22" stroke="#8a6b5b" stroke-width="2" stroke-linecap="round"/>
  <line x1="42" y1="42" x2="46" y2="42" stroke="#8a6b5b" stroke-width="2" stroke-linecap="round"/>
  <line x1="50" y1="22" x2="54" y2="22" stroke="#8a6b5b" stroke-width="2" stroke-linecap="round"/>
  <line x1="50" y1="42" x2="54" y2="42" stroke="#8a6b5b" stroke-width="2" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 5:** Create `src/assets/icons/bell.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M18 36 L14 26 Q14 14 32 10 Q50 14 50 26 L46 36 Z" fill="#ffc94d" stroke="#e0a800" stroke-width="1.5"/>
  <circle cx="32" cy="44" r="4" fill="#ffc94d" stroke="#e0a800" stroke-width="1.5"/>
  <rect x="28" y="46" width="8" height="4" rx="2" fill="#ffc94d" stroke="#e0a800" stroke-width="1"/>
  <circle cx="32" cy="12" r="3" fill="#ffc94d"/>
</svg>
```

- [ ] **Step 6:** Create `src/assets/icons/book.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M8 12 L32 8 L56 12 L56 54 L32 58 L8 54 Z" fill="#fff8ec" stroke="#dfb98f" stroke-width="2"/>
  <line x1="32" y1="8" x2="32" y2="58" stroke="#dfb98f" stroke-width="2"/>
  <line x1="14" y1="16" x2="28" y2="14" stroke="#dfb98f" stroke-width="1.5"/>
  <line x1="14" y1="22" x2="28" y2="20" stroke="#dfb98f" stroke-width="1.5"/>
  <line x1="36" y1="14" x2="50" y2="16" stroke="#dfb98f" stroke-width="1.5"/>
  <line x1="36" y1="20" x2="50" y2="22" stroke="#dfb98f" stroke-width="1.5"/>
  <line x1="14" y1="28" x2="28" y2="26" stroke="#dfb98f" stroke-width="1.5"/>
  <line x1="36" y1="26" x2="50" y2="28" stroke="#dfb98f" stroke-width="1.5"/>
</svg>
```

- [ ] **Step 7:** Create `src/assets/icons/gear.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="8" fill="none" stroke="#8a6b5b" stroke-width="3"/>
  <path d="M32 10 L32 16 M32 48 L32 54 M10 32 L16 32 M48 32 L54 32 M15.8 15.8 L20 20 M44 44 L48.2 48.2 M15.8 48.2 L20 44 M44 20 L48.2 15.8" stroke="#8a6b5b" stroke-width="3" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 8:** Create `src/assets/icons/shuffle.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M46 12 L54 20 L46 28" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 44 L22 44 Q36 44 36 28 Q36 12 46 12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
  <path d="M10 20 L18 20" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
  <path d="M10 28 L24 28" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 9:** Create `src/assets/icons/check-paw.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M26 36 L32 42 L44 26" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="18" cy="20" r="4.5" fill="#fff" opacity="0.7"/>
  <circle cx="46" cy="20" r="4.5" fill="#fff" opacity="0.7"/>
  <ellipse cx="32" cy="34" rx="12" ry="8" fill="none" stroke="#fff" stroke-width="2.5" opacity="0.5"/>
</svg>
```

- [ ] **Step 10:** Create `src/assets/icons/lightbulb-cat.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M24 30 Q24 12 32 8 Q40 12 40 30 L40 36 L24 36 Z" fill="#ffc94d" stroke="#e0a800" stroke-width="1.5"/>
  <path d="M24 36 L40 36 L38 42 L26 42 Z" fill="#ffc94d" stroke="#e0a800" stroke-width="1.5"/>
  <rect x="28" y="42" width="8" height="4" rx="1" fill="#ffc94d" stroke="#e0a800" stroke-width="1"/>
  <path d="M28 36 L26 30" stroke="#e0a800" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M36 36 L38 30" stroke="#e0a800" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M18 14 Q14 12 16 18" fill="#ffc94d"/>
  <path d="M46 14 Q50 12 48 18" fill="#ffc94d"/>
  <circle cx="26" cy="24" r="2" fill="#4a2f24"/>
  <circle cx="38" cy="24" r="2" fill="#4a2f24"/>
  <ellipse cx="32" cy="30" rx="1.5" ry="1" fill="#ffaaa0"/>
</svg>
```

- [ ] **Step 11:** Create `src/assets/decor/yarn-ball.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="20" fill="#ffaaa0"/>
  <path d="M16 24 Q32 8 48 24 Q56 36 44 44 Q28 52 20 40 Q14 30 24 22" fill="none" stroke="#e08a80" stroke-width="1.5"/>
  <path d="M18 34 Q22 28 32 28 Q42 28 46 36" fill="none" stroke="#e08a80" stroke-width="1.5"/>
  <path d="M38 18 Q44 28 38 40" fill="none" stroke="#e08a80" stroke-width="1.5"/>
  <path d="M28 16 Q22 30 28 42" fill="none" stroke="#e08a80" stroke-width="1.5"/>
  <path d="M32 14 L38 6 M38 6 L34 4 M38 6 L42 8" stroke="#ffaaa0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

- [ ] **Step 12:** Create `src/assets/decor/cat-ears.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 16">
  <path d="M4 16 L12 2 L22 16" fill="#ffaaa0" stroke="#e08a80" stroke-width="1"/>
  <path d="M42 16 L52 2 L60 16" fill="#ffaaa0" stroke="#e08a80" stroke-width="1"/>
</svg>
```

- [ ] **Step 13:** Create `src/assets/decor/sleeping-cat.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60">
  <ellipse cx="60" cy="38" rx="44" ry="18" fill="#ffd8c7" stroke="#e0b8a7" stroke-width="1.5"/>
  <circle cx="20" cy="22" r="16" fill="#ffd8c7" stroke="#e0b8a7" stroke-width="1.5"/>
  <path d="M16 14 Q14 10 18 12" fill="none" stroke="#4a2f24" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M24 14 Q26 10 22 12" fill="none" stroke="#4a2f24" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M14 22 Q20 26 26 22" fill="none" stroke="#e0b8a7" stroke-width="1" stroke-linecap="round"/>
  <ellipse cx="60" cy="42" rx="6" ry="2" fill="#ffaaa0"/>
  <path d="M98 28 Q104 20 108 28 Q106 38 100 38 Q94 38 94 32 Q94 28 98 28Z" fill="#ffd8c7" stroke="#e0b8a7" stroke-width="1"/>
  <circle cx="96" cy="30" r="1" fill="#4a2f24"/>
</svg>
```

- [ ] **Step 14:** Create `src/assets/decor/cat-bed.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 64">
  <ellipse cx="60" cy="42" rx="52" ry="18" fill="#ffd8c7" stroke="#e0b8a7" stroke-width="1.5"/>
  <path d="M12 40 Q12 20 30 16 Q60 10 90 16 Q108 20 108 40" fill="none" stroke="#e0b8a7" stroke-width="2"/>
  <ellipse cx="60" cy="44" rx="40" ry="10" fill="#fff8ec" stroke="#dfb98f" stroke-width="1"/>
</svg>
```

- [ ] **Step 15:** Create `src/assets/decor/cat-tree.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 120">
  <rect x="34" y="40" width="12" height="76" rx="4" fill="#dfb98f"/>
  <rect x="30" y="44" width="20" height="6" rx="3" fill="#c9a67a"/>
  <rect x="8" y="10" width="64" height="18" rx="9" fill="#3aa7a3"/>
  <ellipse cx="40" cy="12" rx="4" ry="3" fill="#237a76"/>
  <rect x="6" y="56" width="68" height="16" rx="8" fill="#3aa7a3"/>
  <rect x="10" y="96" width="60" height="14" rx="7" fill="#3aa7a3"/>
</svg>
```

- [ ] **Step 16:** Create `src/assets/decor/plant.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64">
  <rect x="12" y="44" width="24" height="18" rx="3" fill="#ffd8c7" stroke="#e0b8a7" stroke-width="1"/>
  <ellipse cx="24" cy="46" rx="8" ry="2" fill="#ffaaa0"/>
  <path d="M24 44 Q16 28 8 20" fill="none" stroke="#3aa7a3" stroke-width="2" stroke-linecap="round"/>
  <path d="M24 44 Q32 26 40 18" fill="none" stroke="#3aa7a3" stroke-width="2" stroke-linecap="round"/>
  <path d="M24 40 Q20 22 14 12" fill="none" stroke="#3aa7a3" stroke-width="2" stroke-linecap="round"/>
  <path d="M24 40 Q28 20 34 10" fill="none" stroke="#3aa7a3" stroke-width="2" stroke-linecap="round"/>
  <circle cx="8" cy="20" r="4" fill="#3aa7a3"/>
  <circle cx="40" cy="18" r="4" fill="#3aa7a3"/>
  <circle cx="14" cy="12" r="3.5" fill="#3aa7a3"/>
  <circle cx="34" cy="10" r="3.5" fill="#3aa7a3"/>
</svg>
```

- [ ] **Step 17:** Create `src/assets/decor/paw-pattern.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <g opacity="0.08">
    <circle cx="30" cy="40" r="6" fill="#4a2f24"/>
    <circle cx="50" cy="40" r="6" fill="#4a2f24"/>
    <circle cx="18" cy="54" r="6" fill="#4a2f24"/>
    <circle cx="62" cy="54" r="6" fill="#4a2f24"/>
    <ellipse cx="40" cy="58" rx="12" ry="8" fill="#4a2f24"/>
    <circle cx="120" cy="120" r="6" fill="#4a2f24"/>
    <circle cx="140" cy="120" r="6" fill="#4a2f24"/>
    <circle cx="108" cy="134" r="6" fill="#4a2f24"/>
    <circle cx="152" cy="134" r="6" fill="#4a2f24"/>
    <ellipse cx="130" cy="138" rx="12" ry="8" fill="#4a2f24"/>
    <circle cx="170" cy="30" r="6" fill="#4a2f24"/>
    <circle cx="190" cy="30" r="6" fill="#4a2f24"/>
    <circle cx="158" cy="44" r="6" fill="#4a2f24"/>
    <circle cx="202" cy="44" r="6" fill="#4a2f24"/>
    <ellipse cx="180" cy="48" rx="12" ry="8" fill="#4a2f24"/>
    <circle cx="60" cy="170" r="6" fill="#4a2f24"/>
    <circle cx="80" cy="170" r="6" fill="#4a2f24"/>
    <circle cx="48" cy="184" r="6" fill="#4a2f24"/>
    <circle cx="92" cy="184" r="6" fill="#4a2f24"/>
    <ellipse cx="70" cy="188" rx="12" ry="8" fill="#4a2f24"/>
  </g>
</svg>
```

- [ ] **Step 18:** Create `src/assets/decor/string-lights.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40">
  <path d="M0 10 Q40 30 80 10 Q120 30 160 10 Q180 20 200 12" fill="none" stroke="#8a6b5b" stroke-width="1.5"/>
  <circle cx="20" cy="20" r="4" fill="#ffc94d" opacity="0.7"/>
  <circle cx="60" cy="18" r="4" fill="#ffaaa0" opacity="0.7"/>
  <circle cx="100" cy="20" r="4" fill="#ffc94d" opacity="0.7"/>
  <circle cx="140" cy="18" r="4" fill="#ffaaa0" opacity="0.7"/>
  <circle cx="180" cy="16" r="4" fill="#ffc94d" opacity="0.7"/>
  <circle cx="40" cy="22" r="3" fill="#fff" opacity="0.5"/>
  <circle cx="80" cy="14" r="3" fill="#fff" opacity="0.5"/>
  <circle cx="120" cy="22" r="3" fill="#fff" opacity="0.5"/>
  <circle cx="160" cy="14" r="3" fill="#fff" opacity="0.5"/>
</svg>
```

- [ ] **Step 19:** Create `src/assets/ui/app-icon.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="256" fill="#3aa7a3"/>
  <path d="M256 320 Q192 160 320 256 Q288 128 416 256" fill="#237a76"/>
  <path d="M768 320 Q832 160 704 256 Q736 128 608 256" fill="#237a76"/>
  <ellipse cx="352" cy="480" rx="64" ry="56" fill="#fff"/>
  <ellipse cx="672" cy="480" rx="64" ry="56" fill="#fff"/>
  <circle cx="384" cy="480" r="32" fill="#4a2f24"/>
  <circle cx="640" cy="480" r="32" fill="#4a2f24"/>
  <ellipse cx="512" cy="608" rx="32" ry="20" fill="#ffaaa0"/>
  <path d="M384 704 Q512 832 640 704" fill="none" stroke="#237a76" stroke-width="24" stroke-linecap="round"/>
  <circle cx="272" cy="448" r="24" fill="#fff"/>
  <circle cx="752" cy="448" r="24" fill="#fff"/>
  <text x="512" y="860" text-anchor="middle" font-family="system-ui, sans-serif" font-size="120" font-weight="900" fill="#fff">WP</text>
</svg>
```

- [ ] **Step 20:** Create `src/assets/ui/yarn-wheel-ring.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="88" fill="none" stroke="#ffd8c7" stroke-width="4" stroke-dasharray="6 4"/>
  <circle cx="100" cy="100" r="80" fill="none" stroke="#ffaaa0" stroke-width="2" opacity="0.5"/>
  <circle cx="100" cy="100" r="92" fill="none" stroke="#ffd8c7" stroke-width="2" opacity="0.3"/>
</svg>
```

- [ ] **Step 21:** Create `src/assets/ui/tile-texture.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
  <rect width="20" height="20" fill="#fffaf0"/>
  <circle cx="5" cy="5" r="0.5" fill="#dfb98f" opacity="0.15"/>
  <circle cx="15" cy="12" r="0.5" fill="#dfb98f" opacity="0.1"/>
  <circle cx="8" cy="17" r="0.3" fill="#dfb98f" opacity="0.1"/>
</svg>
```

- [ ] **Step 22:** Commit all SVG assets

```bash
git add src/assets/icons/ src/assets/decor/ src/assets/ui/
git commit -m "feat: add cat-themed SVG assets for Word Paws rebrand"
```

---

### Task 2: Update public PWA assets and index.html branding

**Files:**
- Modify: `public/favicon.svg`
- Modify: `public/icon-192.svg`
- Modify: `public/icon-512.svg`
- Modify: `public/manifest.webmanifest`
- Modify: `public/sw.js`
- Modify: `index.html`

- [ ] **Step 1:** Write `public/favicon.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Word Paws icon">
  <rect width="64" height="64" rx="16" fill="#3aa7a3"/>
  <path d="M16 20 Q12 10 20 16 Q18 8 26 16" fill="#237a76"/>
  <path d="M48 20 Q52 10 44 16 Q46 8 38 16" fill="#237a76"/>
  <ellipse cx="22" cy="30" rx="4" ry="3.5" fill="#fff"/>
  <ellipse cx="42" cy="30" rx="4" ry="3.5" fill="#fff"/>
  <circle cx="24" cy="30" r="2" fill="#4a2f24"/>
  <circle cx="40" cy="30" r="2" fill="#4a2f24"/>
  <ellipse cx="32" cy="38" rx="2" ry="1.2" fill="#ffaaa0"/>
  <path d="M24 44 Q32 52 40 44" fill="none" stroke="#237a76" stroke-width="2" stroke-linecap="round"/>
  <circle cx="17" cy="28" r="1.5" fill="#fff"/>
  <circle cx="47" cy="28" r="1.5" fill="#fff"/>
</svg>
```

- [ ] **Step 2:** Write `public/icon-192.svg` with same cat face, viewBox 0 0 192 192, same relative coordinates scaled by 3

- [ ] **Step 3:** Write `public/icon-512.svg` with same cat face, viewBox 0 0 512 512, same relative coordinates scaled by 8

- [ ] **Step 4:** Write `public/manifest.webmanifest`

```json
{
  "id": "/wordgames/",
  "name": "Word Paws",
  "short_name": "Word Paws",
  "description": "A cozy cat-themed word puzzle game. Relax, unwind, and find words with your feline friends.",
  "start_url": "/wordgames/",
  "scope": "/wordgames/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#fff3e4",
  "theme_color": "#3aa7a3",
  "icons": [
    {
      "src": "/wordgames/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    },
    {
      "src": "/wordgames/icon-192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "/wordgames/icon-512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 5:** Update `public/sw.js` — change cache name to `word-paws-offline-v1`

```js
const CACHE_NAME = 'word-paws-offline-v1'
```

- [ ] **Step 6:** Update `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/icon-192.svg" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Word Paws — a cozy cat-themed word puzzle game. Relax, unwind, and find words with your feline friends."
    />
    <meta name="theme-color" content="#fff3e4" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Word Paws" />
    <title>Word Paws</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7:** Commit

```bash
git add public/ index.html
git commit -m "feat: update PWA assets and index.html for Word Paws"
```

---

### Task 3: Rewrite `src/index.css` with full cat theme

**Files:**
- Modify: `src/index.css` — complete rewrite of visual styles

**Interfaces:** All CSS variable names are consumed by component className usage.

- [ ] **Step 1:** Write the complete `src/index.css` with:
  - CSS custom properties for cat theme colors
  - Typography with Nunito/Quicksand/system font stack
  - Background: cream/peach cozy room with SVG decorations
  - Header with cat logo styling
  - Game topbar/level card with cat ears pseudo-elements
  - Stats pills with icon support
  - Grid cells as cream tiles
  - Cat-themed buttons (teal, coral/pink) with icons
  - Letter wheel as yarn ring
  - Level select theme
  - Level complete modal with paw confetti
  - Animations (popCell, shakeFlash, pawSparkle, etc.)
  - Responsive breakpoints for all target sizes
  - `prefers-reduced-motion: reduce`

Full CSS content is provided in the implementation section.

- [ ] **Step 2:** Commit

```bash
git add src/index.css
git commit -m "feat: rewrite stylesheet with cat-themed Word Paws design"
```

---

### Task 4: Update `App.tsx` header branding and background

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1:** Replace header with cat logo + Word Paws text + gear button. Use SVG icon imports.

New header JSX:

```tsx
import catFaceSvg from './assets/icons/cat-face.svg'
import gearSvg from './assets/icons/gear.svg'
```

Replace the header section:

```tsx
<header className="app-header">
  <button className="brand-button" type="button" onClick={() => setScreen('game')}>
    <div className="brand-mark">
      <img src={catFaceSvg} alt="" className="cat-logo" />
    </div>
    <span className="brand-text">Word Paws</span>
  </button>
  <SettingsPanel
    muted={progress.settings.soundMuted}
    onExportSave={handleExportSave}
    onImportSave={handleImportSave}
    onOpenEditor={() => setShowEditor(true)}
    onReset={handleReset}
    onToggleMuted={() =>
      setProgress((current) => ({
        ...current,
        settings: { ...current.settings, soundMuted: !current.settings.soundMuted },
      }))
    }
  />
</header>
```

Also wrap the gear button in SettingsPanel summary. Update SettingsPanel summary to show gear icon instead of text "Settings".

- [ ] **Step 2:** Commit

```bash
git add src/App.tsx
git commit -m "feat: rebrand header with cat logo and Word Paws name"
```

---

### Task 5: Update SettingsPanel with gear icon

**Files:**
- Modify: `src/components/SettingsPanel.tsx`

- [ ] **Step 1:** Import gear SVG, update summary to show icon instead of text

```tsx
import gearSvg from '../assets/icons/gear.svg'
```

Replace the `<summary>Settings</summary>` with:

```tsx
<summary>
  <img src={gearSvg} alt="Settings" className="gear-icon" />
</summary>
```

- [ ] **Step 2:** Commit

```bash
git add src/components/SettingsPanel.tsx
git commit -m "feat: settings panel uses gear icon"
```

---

### Task 6: Update GameScreen with cat-themed topbar, stats, buttons

**Files:**
- Modify: `src/components/GameScreen.tsx`

- [ ] **Step 1:** Import SVG icons

```tsx
import bookSvg from '../assets/icons/book.svg'
import pawCoinSvg from '../assets/icons/paw-coin.svg'
import fishBoneSvg from '../assets/icons/fish-bone.svg'
import pawSvg from '../assets/icons/paw.svg'
import bellSvg from '../assets/icons/bell.svg'
import shuffleSvg from '../assets/icons/shuffle.svg'
import lightbulbCatSvg from '../assets/icons/lightbulb-cat.svg'
```

- [ ] **Step 2:** Replace the game-topbar with cat-themed level card:

```tsx
<section className="game-topbar">
  <button type="button" onClick={onOpenLevels} className="levels-button">
    <img src={bookSvg} alt="" className="btn-icon" />
    <span>Levels</span>
  </button>
  <div className="level-title-block">
    <p className="eyebrow">Level {level.id}</p>
    <h1>{level.title}</h1>
  </div>
  <div className="coin-pill">
    <img src={pawCoinSvg} alt="" className="coin-icon" />
    <span>{progress.coins}</span>
  </div>
</section>
```

- [ ] **Step 3:** Replace progress-strip with cat-themed stat pills:

```tsx
<div className="stats-row">
  <span className="stat-pill">
    <img src={fishBoneSvg} alt="" className="stat-icon" />
    <span>{foundCount}/{solvedLevel.words.length}</span>
  </span>
  <span className="stat-pill">
    <img src={pawSvg} alt="" className="stat-icon" />
    <span>{levelProgress.foundBonusWords.length}</span>
  </span>
  <span className="stat-pill">
    <img src={bellSvg} alt="" className="stat-icon" />
    <span>{progress.usedHints}</span>
  </span>
</div>
```

- [ ] **Step 4:** Replace power-actions with icon buttons:

```tsx
<div className="power-actions">
  <button type="button" onClick={shuffleLetters} className="btn-teal">
    <img src={shuffleSvg} alt="" className="btn-icon" />
    <span>Shuffle</span>
  </button>
  <button type="button" onClick={revealHint} className="btn-coral">
    <img src={lightbulbCatSvg} alt="" className="btn-icon" />
    <span>Hint</span>
  </button>
</div>
```

- [ ] **Step 5:** Commit

```bash
git add src/components/GameScreen.tsx
git commit -m "feat: cat-themed topbar, stat pills, and icon buttons"
```

---

### Task 7: Update LetterWheel with cat-themed clear/enter buttons

**Files:**
- Modify: `src/components/LetterWheel.tsx`

- [ ] **Step 1:** Import icon SVGs

```tsx
import pawSvg from '../assets/icons/paw.svg'
import checkPawSvg from '../assets/icons/check-paw.svg'
```

- [ ] **Step 2:** Replace Clear and Enter buttons with icon versions

```tsx
<div className="tap-actions" aria-label="Tap input actions">
  <button type="button" onClick={() => commitSelection([])} className="btn-teal">
    <img src={pawSvg} alt="" className="btn-icon" />
    <span>Clear</span>
  </button>
  <button type="button" onClick={submitSelected} className="btn-coral">
    <img src={checkPawSvg} alt="" className="btn-icon" />
    <span>Enter</span>
  </button>
</div>
```

- [ ] **Step 3:** Commit

```bash
git add src/components/LetterWheel.tsx
git commit -m "feat: cat-themed clear/enter buttons with paw icons"
```

---

### Task 8: Update LevelCompleteModal with cat theme

**Files:**
- Modify: `src/components/LevelCompleteModal.tsx`

- [ ] **Step 1:** Replace celebration burst with paw/star confetti. Replace text with cat-themed messages.

```tsx
export function LevelCompleteModal({
  title,
  coins,
  hasNextLevel,
  onNext,
  onLevels,
}: LevelCompleteModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="complete-modal" role="dialog" aria-modal="true">
        <div className="celebration-burst" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index} className="confetti-particle" style={{ '--particle-index': index } as CSSProperties} />
          ))}
        </div>
        <div className="cat-ear-decoration" aria-hidden="true" />
        <p className="eyebrow">Pawsome!</p>
        <h2>{title}</h2>
        <p>You cleared the board. A cozy new puzzle awaits.</p>
        <div className="reward-card">
          <span>Total coins: {coins}</span>
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onLevels} className="btn-outline">
            Levels
          </button>
          {hasNextLevel && (
            <button className="btn-coral" type="button" onClick={onNext}>
              Next Level
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2:** Commit

```bash
git add src/components/LevelCompleteModal.tsx
git commit -m "feat: cat-themed level complete modal"
```

---

### Task 9: Update LevelSelect with cat theme

**Files:**
- Modify: `src/components/LevelSelect.tsx`

- [ ] **Step 1:** Update the section heading text

```tsx
<p className="eyebrow">Choose a cozy puzzle</p>
<h1>Word Paws</h1>
<p>All completed puzzles stay unlocked. Play any time.</p>
```

- [ ] **Step 2:** Commit

```bash
git add src/components/LevelSelect.tsx
git commit -m "feat: cat-themed level select branding"
```

---

### Task 10: Build verification

- [ ] **Step 1:** Run production build

```bash
npm run build
```

Expected: `tsc -b && vite build` succeeds with no errors.

- [ ] **Step 2:** Run lint

```bash
npm run lint
```

Expected: oxlint passes with no errors.

- [ ] **Step 3:** If any issues, fix and re-run. Then commit any remaining changes.

```bash
git add -A
git commit -m "fix: address build and lint issues from cat theme"
```
