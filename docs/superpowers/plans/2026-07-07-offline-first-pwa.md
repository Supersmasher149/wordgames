# Offline-First PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Word Grove installable and fully playable offline after first load while keeping all game data and saves local.

**Architecture:** Add a dependency-free service worker and manifest in `public/`, register it from `src/registerServiceWorker.ts`, keep levels/dictionary as local JSON, and version save data in `src/game/persistence.ts`. Settings exposes reset plus JSON save export/import.

**Tech Stack:** React, Vite, TypeScript, plain CSS, localStorage, Web App Manifest, Service Worker Cache API.

## Global Constraints

- Do not add accounts.
- Do not add multiplayer.
- Do not add ads.
- Do not add a backend.
- Keep the product lightweight, local, and easy to package later for desktop or mobile.

---

### Task 1: PWA Shell

**Files:**
- Modify: `index.html`
- Modify: `public/manifest.webmanifest`
- Create: `public/sw.js`
- Create: `public/icon-192.svg`
- Create: `public/icon-512.svg`
- Modify: `public/favicon.svg`
- Create: `src/registerServiceWorker.ts`
- Modify: `src/main.tsx`

**Interfaces:**
- Produces: `registerServiceWorker(): void`.

- [x] Add install metadata, placeholder icons, app-shell caching, offline navigation fallback, and production-only registration.

### Task 2: Local Dictionary And Save Versioning

**Files:**
- Create: `src/data/dictionary.json`
- Create: `src/data/dictionary.ts`
- Modify: `src/game/types.ts`
- Modify: `src/game/persistence.ts`
- Modify: `src/game/levelValidation.ts`
- Modify: `src/components/GameScreen.tsx`
- Modify: `src/components/LevelSelect.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `SAVE_DATA_VERSION`, `exportProgress`, `importProgress`, `PlayerSettings`, `SaveData`, local dictionary validation.

- [x] Add local dictionary source, validate level words against it, add save versioning, persist unlocked levels, and support save import/export.

### Task 3: Settings UI And Docs

**Files:**
- Modify: `src/components/SettingsPanel.tsx`
- Modify: `src/index.css`
- Modify: `README.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: export/import persistence helpers.

- [x] Add reset/export/import controls and document offline-first file locations and commands.

### Task 4: Verification

- [x] Run `npm run build`.
- [x] Run `npm run lint`.
- [x] Fix any TypeScript, bundling, level validation, or lint failures.
