# Project Plan — Local-First Desktop Novel Workspace
**Version:** 1.2 (Revised)
**Author:** Andy Wentzloff
**Status:** Pre-Development — Awaiting Approval

---

## Table of Contents

1. [Overview](#overview)
2. [Core Philosophy](#core-philosophy)
3. [Technology Stack](#technology-stack)
4. [Project Folder Structure (App Data)](#project-folder-structure-app-data)
5. [GitHub Repository Structure](#github-repository-structure)
6. [Auto-Update Architecture](#auto-update-architecture)
7. [Data Model & Relationships](#data-model--relationships)
8. [Development Phases](#development-phases)
   - [Phase 0 — Infrastructure & Repository Setup](#phase-0--infrastructure--repository-setup)
   - [Phase 1 — True MVP](#phase-1--true-mvp)
   - [Phase 2 — Story Structure Tools](#phase-2--story-structure-tools)
   - [Phase 3 — World & Lore Tools](#phase-3--world--lore-tools)
   - [Phase 4 — Import / Export](#phase-4--import--export)
   - [Post-MVP — Long-Term Vision](#post-mvp--long-term-vision)
9. [Beginner vs. Advanced Mode](#beginner-vs-advanced-mode)
10. [Non-Goals for MVP](#non-goals-for-mvp)
11. [What Makes This Application Unique](#what-makes-this-application-unique)
12. [Code Signing & Distribution Notes](#code-signing--distribution-notes)
13. [Developer Notes (DEV_NOTES.md Summary)](#developer-notes-dev_notesmd-summary)

---

## Overview

This project is a **local-first desktop application** for writing and managing novels. It unifies drafting, plotting, worldbuilding, character tracking, timeline management, continuity checking, and manuscript export into a single tool.

The application is designed so writers are **never locked in**. All project data lives in a normal folder on the user's computer using Markdown, JSON, and image files. Users can freely move between this app and tools like Obsidian, Scrivener, Plottr, and Microsoft Word at any time.

This is **not a cloud app**. It is a **free, open source**, local desktop application built with **Electron**, targeting **Windows**, packaged and distributed as a native `.exe` installer, with user-controlled updates delivered through **GitHub Releases**.

---

## Core Philosophy

- The **project folder is the database** — not a proprietary binary format
- All content is **human-readable and portable** (Markdown + JSON)
- The app is a **smart interface over files**, not a silo
- Users can **leave the app at any time** without data loss or conversion
- **Integrations are handled through import/export**, not live API connections
- If the app is uninstalled, **the novel project is fully intact and usable** in any text editor or compatible tool
- The application is **free to use and open source** — no cost, no accounts, no subscriptions, ever
- The codebase is **platform-abstracted** — designed so a future web or mobile version can share the same core logic

---

## Technology Stack

| Layer | Choice | Reason |
|---|---|---|
| Desktop Runtime | **Electron** | Windows desktop app with native filesystem access |
| UI Framework | **Svelte** | Compiles to vanilla JS, minimal overhead, clean reactive syntax, pairs well with Electron |
| Language | **TypeScript** | Type safety for complex data relationships; same stack as Obsidian; catches bugs at write time not runtime |
| Markdown Editor | **CodeMirror 6** | Mature, extensible, supports syntax highlighting and custom keybindings; same editor as Obsidian |
| Markdown Parser | **marked.js** | Fast, lightweight, widely supported |
| Metadata Format | **JSON** | Human-readable, easy to version control, no parser dependencies |
| Storage Layer | **StorageAdapter interface** | Abstracts all file I/O so the same app logic works on desktop, web, and mobile via swappable adapters |
| Packaging & Builds | **electron-builder** | Generates Windows `.exe` installer and publishes to GitHub Releases |
| Update Checker | **electron-updater** | User-prompted only — nothing downloads without explicit permission |
| IDE | **VS Code** | Free, excellent TypeScript and Svelte support, integrates with Git |
| Version Control | **Git + GitHub (public repo)** | Free tier; source code, Issues, Milestones, Actions, and Releases all in one place |
| Code Signing | **SignPath Foundation** | Free code signing for open source projects; eliminates Windows SmartScreen warnings |
| Target Platform | **Windows** | macOS requires a paid Apple Developer account ($99/year) — added when budget allows |

### Why Svelte over React or Vue?

Svelte compiles away at build time — there is no virtual DOM, no runtime library overhead. The output is lean vanilla JavaScript. For a desktop app where startup performance matters and state management is tied closely to the filesystem, Svelte's reactive model is a natural fit. It also has a gentler learning curve than React for this use case.

### Why CodeMirror 6 over a simpler textarea?

A plain `<textarea>` has no awareness of Markdown structure. CodeMirror 6 provides Markdown syntax highlighting, keyboard shortcuts (bold, italic, headings) via extensions, and a plugin system for future features like word count overlays or distraction-free mode. It is also the same editor Obsidian uses — a strong signal it handles the novel-writing use case well.

TypeScript is JavaScript with a type system. It compiles to plain JavaScript and works with everything in the stack without changing any other decision. For this project specifically, the data model is built on relationships between scenes, characters, locations, and lore — all represented as structured JSON. TypeScript enforces the shape of that data at the moment you write code, not when the app crashes mid-writing session. It also makes the StorageAdapter interface (see below) self-documenting and enforced by the compiler. This is the same language Obsidian uses for its entire codebase.

### Why a StorageAdapter interface?

All file I/O in the app goes through a single `StorageAdapter` interface rather than calling Node.js `fs` directly. The desktop version uses `ElectronStorageAdapter` (Node.js `fs`). A future web version would use `WebStorageAdapter` (browser File System Access API). A future mobile version would use `CapacitorStorageAdapter`. The app logic never changes — only the adapter swaps. This is the same pattern Obsidian uses to share a codebase between desktop and mobile.

```typescript
// The contract every platform must fulfill
interface StorageAdapter {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  listFiles(directory: string): Promise<string[]>;
  deleteFile(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}
```

---

## Project Folder Structure (App Data)

This is the structure of a **writer's novel project folder** — not the source code repo. This folder is the single source of truth for all novel content.

```
/MyNovel/
  project.json              ← Project metadata (title, author, version, settings)
  /scenes/
    001-the-beginning.md    ← Scene content in Markdown
    001-the-beginning.json  ← Scene metadata (characters, location, date, status, order)
    002-the-crossing.md
    002-the-crossing.json
  /characters/
    kaelen.md               ← Character sheet in Markdown
    kaelen.json             ← Character metadata (aliases, tags, first appearance)
  /locations/
    thornhaven.md
    thornhaven.json
  /lore/
    the-sundering.md        ← Lore/worldbuilding page
  /notes/
    inbox.md                ← Quick capture notes (converted to scenes/characters/lore later)
  /assets/
    map-eltharien.png       ← Images, maps, reference art
```

**Rules:**
- Every `.md` file has a matching `.json` sidecar for metadata
- File names are slugified (lowercase, hyphens, no spaces)
- Scene order is controlled by numeric prefix + `order` field in JSON, not the filename alone
- The `project.json` at the root stores global metadata, settings, and format version

---

## GitHub Repository Structure

This section covers the **source code repository** structure on GitHub — separate from the novel project folder above.

### Branches

| Branch | Purpose |
|---|---|
| `main` | Stable, production-ready code. Tagged releases only. |
| `dev` | Active development branch. All feature branches merge here first. |
| `feature/[name]` | Individual feature branches, branched off `dev` |
| `hotfix/[name]` | Critical bug fixes branched off `main`, merged to both `main` and `dev` |

**Rule:** No direct commits to `main`. All merges to `main` must be from `dev` and must be tagged with a version number (e.g., `v1.0.0`, `v1.1.0`).

### GitHub Issues & Milestones

- **Every feature and bug** gets a GitHub Issue
- Issues are labeled: `feature`, `bug`, `enhancement`, `docs`, `infrastructure`
- Issues are assigned to **Milestones** that map to phases:

| Milestone | Phase |
|---|---|
| `Phase 0 - Infrastructure` | Repo, Electron boilerplate, build pipeline |
| `Phase 1 - MVP` | Core writing features |
| `Phase 2 - Story Structure` | Character, location, plot board |
| `Phase 3 - World & Lore` | Timeline, lore wiki, notes inbox |
| `Phase 4 - Import/Export` | Tool compatibility layer |

### Repository Files (Root Level)

```
/
  DEV_NOTES.md              ← Developer context file: architecture decisions, conventions, start-here guide
  PROJECT_PLAN.md           ← This document
  README.md                 ← Public-facing project description
  CHANGELOG.md              ← Version history (updated with every release)
  package.json              ← Electron app config, version number, build config
  tsconfig.json             ← TypeScript compiler configuration
  .gitignore                ← Excludes node_modules, dist, .DS_Store, etc.
  /.github/
    /workflows/
      build-and-release.yml ← GitHub Actions: builds and publishes on version tag push
  /src/
    main.ts                 ← Electron main process
    preload.ts              ← Electron preload script (IPC bridge)
    /renderer/              ← Svelte UI (compiled to /dist/)
      App.svelte
      /components/
      /stores/
      /views/
  /src-shared/
    /storage/
      StorageAdapter.ts     ← Interface definition (the contract all platforms must fulfill)
      ElectronAdapter.ts    ← Windows/desktop implementation using Node.js fs
    fileModel.ts            ← Data model logic (read/write project files via StorageAdapter)
    updateChecker.ts        ← Update check and user-prompt logic
    types.ts                ← Shared TypeScript interfaces (SceneMetadata, CharacterMetadata, etc.)
```

---

## Update Architecture

Updates are handled through **electron-builder** (for packaging) and **electron-updater** (for delivery), using **GitHub Releases** as the update server. Updates are **never automatic** — the user is always asked before anything is downloaded or installed.

### How It Works

```
Developer pushes a version tag (e.g., v1.2.0) to GitHub
  → GitHub Actions workflow triggers
  → electron-builder compiles the app for Windows (and/or macOS)
  → Installer (.exe / .dmg) + latest.yml published to GitHub Releases

User launches the app
  → App silently checks GitHub Releases for latest.yml
  → Compares remote version to installed version
  → If a newer version exists:
       → Dialog appears: "Version X.X.X is available. Would you like to download it?"
       → User clicks "Yes" → download begins, progress shown
       → User clicks "No" or closes → nothing happens, no download, no install
  → After download completes (only if user said Yes):
       → Second dialog: "Update downloaded. Restart now to install, or install next time you open the app."
       → User clicks "Restart Now" → installs and relaunches
       → User clicks "Later" → update installs on next normal app launch
  → If no update is found → app opens normally with no dialog shown
```

The user is **never surprised by an update**. Nothing downloads without explicit permission. Nothing installs without a second confirmation.

### Implementation

**In `package.json`:**
```json
{
  "version": "1.0.0",
  "build": {
    "appId": "com.yourname.novelworkspace",
    "productName": "Novel Workspace",
    "publish": {
      "provider": "github",
      "owner": "YOUR_GITHUB_USERNAME",
      "repo": "YOUR_REPO_NAME"
    }
  }
}
```

**In `src/main.js`:**
```javascript
const { autoUpdater } = require('electron-updater');

// Disable automatic downloading — we ask the user first
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

app.whenReady().then(() => {
  createWindow();
  // Silently check — no dialog if there's nothing new
  autoUpdater.checkForUpdates();
});

// An update exists — ask the user before downloading anything
autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: `Version ${info.version} is available.`,
    detail: 'Would you like to download it now? You can continue using the app while it downloads.',
    buttons: ['Download Now', 'Not Right Now'],
    defaultId: 0,
    cancelId: 1
  }).then(result => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
    // If user clicks "Not Right Now", nothing happens
  });
});

// Show download progress (optional — can be shown in a status bar instead)
autoUpdater.on('download-progress', (progress) => {
  mainWindow.setProgressBar(progress.percent / 100);
});

// Download finished — ask if they want to restart now or later
autoUpdater.on('update-downloaded', () => {
  mainWindow.setProgressBar(-1); // Clear progress bar
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'The update has been downloaded.',
    detail: 'Restart now to install it, or it will be installed automatically the next time you open the app.',
    buttons: ['Restart Now', 'Install Later'],
    defaultId: 0,
    cancelId: 1
  }).then(result => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
    // If user clicks "Install Later", update installs on next launch automatically
  });
});

// No update found — do nothing, open normally
autoUpdater.on('update-not-available', () => {
  // Intentionally silent
});
```

**GitHub Actions workflow (`.github/workflows/build-and-release.yml`):**
```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - name: Publish to GitHub Releases
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run dist
```

### Release Process (Step by Step)

1. Merge `dev` → `main` when ready for a release
2. Update `version` in `package.json` (e.g., `1.0.0` → `1.1.0`)
3. Update `CHANGELOG.md` with what changed
4. Commit: `git commit -m "chore: release v1.1.0"`
5. Tag: `git tag v1.1.0`
6. Push tag: `git push origin v1.1.0`
7. GitHub Actions builds the installer and publishes it to GitHub Releases automatically
8. Users are notified on next app launch and choose whether to update

---

## Data Model & Relationships

The entire system is built on relationships between content nodes. Every piece of content (scenes, characters, locations, lore) can reference every other piece.

```
Scene ←→ Characters (many-to-many)
Scene ←→ Locations  (many-to-one)
Scene ←→ Time       (one-to-one, optional)
Scene ←→ Lore       (many-to-many, tagged references)
Character ←→ Locations
```

From these relationships the app can automatically generate:

- **Character appearance lists** — which scenes does a character appear in?
- **Timeline view** — scenes sorted by in-world date, not manuscript order
- **Plot board** — scenes arranged by act/chapter
- **Continuity search** — find inconsistencies in character/location presence
- **Writing statistics** — words by scene, chapter, POV character, status

### Scene Metadata Schema (`scene.json`)

```json
{
  "id": "uuid-v4",
  "title": "The Crossing at Thornhaven",
  "order": 3,
  "act": 1,
  "chapter": 1,
  "status": "draft",
  "pov": "kaelen",
  "characters": ["kaelen", "dareth"],
  "location": "thornhaven",
  "inWorldDate": "Year 1, Day 12",
  "tags": ["action", "discovery"],
  "wordCount": 1247,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-15T12:30:00Z"
}
```

### Character Metadata Schema (`character.json`)

```json
{
  "id": "uuid-v4",
  "slug": "kaelen",
  "name": "Kaelen",
  "aliases": ["The Wanderer"],
  "tags": ["protagonist", "divine-child"],
  "firstAppearance": "scene-uuid",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

## Development Phases

### Phase 0 — Infrastructure & Repository Setup

**Goal:** Everything is in place before a single line of app logic is written. This phase has no user-visible features — it is entirely foundational.

**Deliverables:**

- [ ] GitHub repository created as **public**, with correct branch structure (`main`, `dev`)
- [ ] `.gitignore` configured (excludes `node_modules/`, `dist/`, `.DS_Store`, `*.log`)
- [ ] `DEV_NOTES.md` written and committed
- [ ] `README.md` and `PROJECT_PLAN.md` committed
- [ ] GitHub Milestones created for all phases
- [ ] GitHub Issue labels created (`feature`, `bug`, `enhancement`, `docs`, `infrastructure`)
- [ ] Electron boilerplate project initialized with **TypeScript** (`npm init`, `electron`, `typescript` installed)
- [ ] `tsconfig.json` configured for Electron + Svelte
- [ ] Svelte integrated into the Electron renderer process with TypeScript support
- [ ] `src-shared/storage/StorageAdapter.ts` interface created
- [ ] `src-shared/storage/ElectronAdapter.ts` implemented using Node.js `fs`
- [ ] `src-shared/types.ts` created with `SceneMetadata` and `CharacterMetadata` interfaces
- [ ] Confirmed that **no file I/O exists outside of `ElectronAdapter.ts`**
- [ ] `electron-builder` installed and configured for **Windows only** in `package.json`
- [ ] `electron-updater` installed with `autoDownload = false` wired into `main.ts`
- [ ] GitHub Actions workflow file created and tested with a dummy `v0.0.1` tag
- [ ] Confirmed that pushing a tag creates a GitHub Release with a Windows `.exe` automatically
- [ ] **SignPath Foundation** account created and linked to the GitHub repo for free code signing
- [ ] Confirmed update prompt appears correctly when a newer version is available
- [ ] Basic app window opens and displays "Hello from Svelte" — confirming the full stack works end to end

**Phase 0 is complete when:** Pushing a version tag to GitHub automatically produces a signed, downloadable Windows `.exe` installer in GitHub Releases, the app window opens correctly, and the update prompt appears as expected when a newer version exists.

---

### Phase 1 — True MVP

**Goal:** A writer can create a project, write scenes, and export a manuscript. Nothing more.

**Features:**

#### 1.1 Project Management
- Create a new novel project (generates folder structure + `project.json`)
- Open an existing project folder via file dialog
- Recent projects list on app open
- Project settings panel (title, author name, default export format)

#### 1.2 Scene Editor (Primary View)
- Scene list in sidebar (ordered, drag-to-reorder)
- CodeMirror 6 Markdown editor for scene content
- Auto-save on change (debounced 2 seconds)
- Scene metadata panel (collapsible):
  - Title
  - Status (Draft / Revise / Final)
  - POV character (free text for Phase 1; linked in Phase 2)
  - Word count (live, per scene)
- Add / rename / delete scenes

#### 1.3 Statistics Panel
- Total word count across all scenes
- Word count by scene
- Scene count by status (Draft / Revise / Final)
- Simple progress bar toward a configurable word count goal

#### 1.4 Manuscript Export
- Compile all scenes in manuscript order
- Export to `.docx` (using `docx` npm package)
- Include scene titles as section headings (optional toggle)
- Include/exclude scenes by status (e.g., exclude "Draft" scenes from export)

**Phase 1 is complete when:** A writer can open the app, create a novel project, write multiple scenes, reorder them, see word counts, and export a clean `.docx` manuscript.

---

### Phase 2 — Story Structure Tools

**Goal:** Add the relational layer — characters, locations, and a visual plot board.

**Features:**

#### 2.1 Character Pages
- Character list in sidebar
- Markdown character sheet editor
- Character metadata: name, aliases, tags
- Auto-generated list of scenes this character appears in (read from scene JSON sidecar files)
- Add character references to scene metadata panel (dropdown from character list)

#### 2.2 Location Pages
- Location list in sidebar
- Markdown location page editor
- Location metadata: name, tags, linked map image
- Auto-generated list of scenes set at this location
- Add location reference to scene metadata panel

#### 2.3 Plot Board View
- Scene cards displayed in a column-based board (Act 1 / Act 2A / Act 2B / Act 3, or custom acts)
- Cards show: title, POV, status color, word count
- Drag cards between acts and within acts (reorders scene metadata accordingly)
- Acts are configurable in project settings

**Phase 2 is complete when:** Characters and locations are linked to scenes, and the plot board reflects the full scene structure visually.

---

### Phase 3 — World & Lore Tools

**Goal:** Add the worldbuilding and organizational layers.

**Features:**

#### 3.1 Timeline View
- Generated automatically from `inWorldDate` fields on scene metadata
- Two views toggle: Manuscript Order vs. Chronological Order
- Highlights scenes out of chronological order vs. manuscript order
- Click a timeline entry to open that scene

#### 3.2 Lore Wiki
- Wiki-style Markdown pages in `/lore/` folder
- `[[wikilink]]` syntax for linking between pages
- Backlinks panel: shows which pages link to the current one
- Search across all lore pages

#### 3.3 Notes Inbox
- Freeform Markdown note capture (quick, always accessible via hotkey)
- Notes list view
- "Promote" action: convert a note into a scene, character page, location, or lore entry

**Phase 3 is complete when:** Writers can maintain an in-world timeline, a linked lore wiki, and capture quick ideas without interrupting their writing flow.

---

### Phase 4 — Import / Export

**Goal:** Make the app a first-class citizen in a broader writing workflow.

| Tool | Method | Direction |
|---|---|---|
| Obsidian | Open project `/lore/` folder directly as a vault | Bidirectional |
| Microsoft Word | Import `.docx` → split into scenes; Export manuscript as `.docx` | Bidirectional |
| Plottr | Scene CSV export/import | Bidirectional |
| Aeon Timeline | Timeline CSV export | Export only |
| Plain Text | Export all scenes as individual `.txt` files | Export only |

No live API integrations required. All import/export is file-based.

**Phase 4 is complete when:** A writer can move their project content in and out of the three major compatible tools without data loss.

---

### Post-MVP — Long-Term Vision

These features are acknowledged but explicitly out of scope until Phase 4 is complete.

- **Graph visualization** — visual node map of scene/character/location/lore relationships
- **Continuity checker** — flag scenes where a dead character appears, or a location is used before it's established
- **Optional cloud sync** — read/write to a Dropbox or OneDrive folder (no proprietary cloud)
- **Plugin system** — allow community extensions
- **Web version** — SvelteKit frontend with a `WebStorageAdapter` using the browser File System Access API; the StorageAdapter pattern means the core app logic requires no changes
- **Mobile version** — Svelte + Capacitor with a `CapacitorStorageAdapter`; again, only a new adapter is needed
- **Distraction-free mode** — full-screen writing UI with no UI chrome

---

## Beginner vs. Advanced Mode

The same underlying data model powers both modes. Only the UI complexity changes.

| Feature | Beginner Mode | Advanced Mode |
|---|---|---|
| Scene metadata panel | Hidden or collapsed by default | Expanded and always visible |
| Tags and dates | Hidden | Visible and editable |
| Timeline view | Not shown in nav | Available |
| Statistics detail | Simple total word count only | Full breakdown by scene, character, POV, status |
| Plot board | Not shown in nav | Available |
| Lore wiki | Not shown in nav | Available |
| Keyboard shortcuts | Minimal | Full shortcut set shown in UI |

Mode is toggled in app settings. The project data is identical regardless of mode — switching modes does not modify or migrate any files.

---

## Non-Goals for MVP

The following are explicitly excluded from Phase 0 through Phase 1 scope:

- No cloud accounts or cloud storage
- No real-time collaboration
- No syncing service of any kind (the app reads/writes local files only)
- No plugin system
- No mobile version
- No graph visualization
- No continuity checker
- No live API integrations with third-party tools

---

## What Makes This Application Unique

Most writing tools are siloed. They handle one part of the writing process well and require separate tools for everything else. This application understands that **a novel is a network of relationships** and builds multiple views from a single, shared data model.

It is designed to replace the need to juggle:

| Need | Typical Tool | This App |
|---|---|---|
| Scene drafting | Scrivener / Word | ✓ Built-in |
| Plot board | Plottr / index cards | ✓ Built-in |
| Worldbuilding wiki | Obsidian / Notion | ✓ Built-in |
| Character database | Airtable / spreadsheet | ✓ Built-in |
| Timeline tracker | Aeon Timeline | ✓ Built-in |
| Continuity checking | Manual / spreadsheet | ✓ Built-in (post-MVP) |
| Notes capture | Notion / Bear | ✓ Built-in |
| Progress tracking | Spreadsheet | ✓ Built-in |
| Manuscript export | Word / Scrivener | ✓ Built-in |

While still **allowing writers to use their preferred tools** — because the project folder is just files.

---

## Code Signing & Distribution

### Windows — Free via SignPath Foundation

Because the repository is **public on GitHub**, code signing for Windows is available at no cost through **SignPath Foundation**. They verify that the published binary was built directly from the public GitHub repository, sign it with their certificate, and vouch for it — no personal ID required, no hardware token needed, and the private key is stored securely on their servers so it integrates cleanly with the GitHub Actions build pipeline.

With SignPath Foundation configured, Windows users will **not** see a SmartScreen warning when installing. Setup is done once during Phase 0 and requires:

1. Creating a free account at [signpath.org](https://signpath.org)
2. Linking it to the GitHub repository
3. Adding the SignPath signing step to the GitHub Actions workflow

### macOS — Deferred

macOS distribution requires a paid Apple Developer account ($99/year) for code signing and notarization. Without it, macOS users receive a hard block from Gatekeeper that requires a manual right-click bypass. macOS support is deferred until the project grows to a point where this cost makes sense. The entire codebase (Electron + Svelte + TypeScript) supports macOS without modification — this is purely a distribution and signing issue, not a code issue.

### Development (No Signing Needed)

During local development the app runs directly with `npm start` and requires no certificate. The update check system works correctly in development mode.

---

## Developer Notes (`DEV_NOTES.md` Summary)

> **Note:** A full `DEV_NOTES.md` file should be created in the root of the GitHub repository. This file serves as the living developer reference — architecture decisions, coding conventions, and a start-here guide for returning to the codebase after any break. The following is the outline for that file.

### What to include in `DEV_NOTES.md`:

**Project Summary**
- One paragraph describing what this app is and what it does
- Free, open source, Windows desktop app for novel writers
- Public GitHub repository — contributions welcome

**Architecture Decisions (non-negotiable)**
- Electron + Svelte + TypeScript + CodeMirror 6
- TypeScript throughout — no plain `.js` files in `/src/` or `/src-shared/`
- async/await only — no callbacks, no `.then()` chains in application logic
- Filesystem-first: the project folder is the database, not an in-memory store that gets periodically saved
- Every scene/character/location has both a `.md` (content) and a `.json` (metadata) sidecar file
- **All file I/O goes through `StorageAdapter`** — no direct `fs` calls anywhere except `ElectronAdapter.ts`
- Updates are user-prompted — `autoDownload = false`, nothing downloads without explicit user consent

**StorageAdapter Rule**
- The only file allowed to import Node.js `fs` is `src-shared/storage/ElectronAdapter.ts`
- All other code calls methods on the `StorageAdapter` interface
- This ensures a future web or mobile version only requires a new adapter file, not a rewrite

**File Structure Convention**
- All source code lives in `/src/`
- Renderer (Svelte UI) lives in `/src/renderer/`
- Main process (Electron) lives in `/src/main.ts` and `/src/preload.ts`
- Shared logic and interfaces live in `/src-shared/`
- All shared TypeScript types live in `/src-shared/types.ts`
- Do not put business logic in Svelte components — keep components presentational

**Coding Standards**
- All functions must have JSDoc comments
- No magic numbers — use named constants
- File I/O must always be wrapped in try/catch with meaningful error messages
- Use `crypto.randomUUID()` for generating IDs (no external UUID library needed)
- Use TypeScript `interface` for all data shapes — no `any` types

**Update Pipeline**
- Releases are published via GitHub Releases triggered by version tags
- Version in `package.json` must be updated before tagging
- `CHANGELOG.md` must be updated with every release
- SignPath Foundation handles code signing automatically in the GitHub Actions workflow

**Off-Limits / Auto-Generated Files**
- `/dist/` — build output, never edit manually
- `package-lock.json` — do not edit manually
- `latest.yml` — generated by electron-builder, never edit manually

**Start Here (Returning to the Codebase)**
1. Read `DEV_NOTES.md` (this file) to re-orient
2. Read `CHANGELOG.md` to see what has been built and what changed last
3. Check open GitHub Issues for the current phase milestone
4. Identify which Issue to work on before writing any code

---

*This document is the living specification for this project. It should be updated whenever architectural decisions change, phases are completed, or scope is adjusted.*
