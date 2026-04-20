# DEV_NOTES.md — Developer Reference
**Last Updated:** 2026-04-19
**Current Phase:** Phase 3 — World & Lore Tools
**Current Version:** 0.2.0 (pre-release)

> This file is the first thing to read when returning to this codebase after any break.
> It is also the reference document for anyone contributing to the project.
> Keep it up to date — an outdated DEV_NOTES is worse than none.

---

## Table of Contents

1. [What This Project Is](#what-this-project-is)
2. [Tech Stack At a Glance](#tech-stack-at-a-glance)
3. [Where Things Live](#where-things-live)
4. [The Golden Rules](#the-golden-rules)
5. [Architecture Decisions](#architecture-decisions)
6. [Coding Standards](#coding-standards)
7. [Data Model Reference](#data-model-reference)
8. [StorageAdapter Pattern](#storageadapter-pattern)
9. [Update Pipeline](#update-pipeline)
10. [Release Process (Step by Step)](#release-process-step-by-step)
11. [Off-Limits Files](#off-limits-files)
12. [Start Here — Returning to the Codebase](#start-here--returning-to-the-codebase)
13. [Current Known Issues & TODOs](#current-known-issues--todos)
14. [Decision Log](#decision-log)

---

## What This Project Is

A **free, open source, local-first desktop application** for writing and managing novels on Windows. It unifies scene drafting, character tracking, worldbuilding, plot structure, timeline management, and manuscript export into a single tool — without locking the writer into any proprietary format.

All novel data lives in a normal folder on the writer's computer as plain Markdown and JSON files. If this app is uninstalled, the novel is fully intact and readable in any text editor or compatible tool.

**Target user:** Solo novelist. Personal use. No accounts, no subscriptions, no internet required to write.

**Repository:** Public on GitHub. Free to use, free to contribute.

**Platform:** Windows (macOS deferred — requires paid Apple Developer account).

---

## Tech Stack At a Glance

| Layer | Tool | Version |
|---|---|---|
| Desktop runtime | Electron | (check package.json) |
| UI framework | Svelte | (check package.json) |
| Language | TypeScript | (check package.json) |
| Markdown editor | CodeMirror 6 | (check package.json) |
| Markdown parser | marked.js | (check package.json) |
| Packaging | electron-builder | (check package.json) |
| Update checker | electron-updater | (check package.json) |
| IDE | VS Code | latest |
| Version control | Git + GitHub | — |
| Code signing | SignPath Foundation | — |

---

## Where Things Live

```
/
├── DEV_NOTES.md              ← You are here
├── PROJECT_PLAN.md           ← Full project specification and phase roadmap
├── README.md                 ← Public-facing description (what users see on GitHub)
├── CHANGELOG.md              ← Version history — updated with every release
├── package.json              ← Dependencies, scripts, electron-builder config
├── tsconfig.json             ← TypeScript compiler config
├── .gitignore
│
├── /.github/
│   └── /workflows/
│       └── build-and-release.yml   ← GitHub Actions: builds + signs + publishes on tag push
│
├── /src/                     ← Electron process code
│   ├── main.ts               ← Main process: app lifecycle, window creation, IPC handlers
│   ├── preload.ts            ← Preload script: exposes safe IPC bridge to renderer
│   └── /renderer/            ← Svelte UI (compiled output goes to /dist/)
│       ├── App.svelte         ← Root component
│       ├── /components/       ← Reusable UI components (buttons, inputs, panels)
│       ├── /stores/           ← Svelte stores (reactive app state)
│       └── /views/            ← Full page/panel views (SceneEditor, PlotBoard, etc.)
│
├── /src-shared/              ← Logic shared across processes (no Electron-specific imports)
│   ├── types.ts              ← ALL TypeScript interfaces live here
│   ├── fileModel.ts          ← Read/write project files (always via StorageAdapter)
│   ├── updateChecker.ts      ← Update check and user-prompt logic
│   └── /storage/
│       ├── StorageAdapter.ts ← Interface definition (the contract all platforms fulfill)
│       └── ElectronAdapter.ts← Windows desktop implementation (the ONLY file that imports fs)
│
└── /dist/                    ← Build output — NEVER edit manually, not committed to git
```

---

## The Golden Rules

These are non-negotiable. If you are unsure about a decision, these rules take priority.

### Rule 1 — StorageAdapter is the only path to the filesystem
The **only** file allowed to import Node.js `fs` (or `fs/promises`) is:
```
src-shared/storage/ElectronAdapter.ts
```
All other code calls methods on the `StorageAdapter` interface. No exceptions.
This ensures a future web or mobile version only needs a new adapter file.

### Rule 2 — No business logic in Svelte components
Svelte components are for UI only — rendering, layout, user events. Any logic that reads from or writes to a project (scenes, characters, locations, lore) belongs in `src-shared/fileModel.ts` or a dedicated module. Components call functions; they do not contain data transformation logic.

### Rule 3 — TypeScript everywhere, no `any`
All files in `/src/` and `/src-shared/` are `.ts` or `.svelte` with `<script lang="ts">`. The `any` type is banned. If you don't know the type, use `unknown` and narrow it explicitly.

### Rule 4 — async/await only
No callbacks. No `.then()` chains in application logic. Use `async/await` throughout.
Wrap every `await` call that touches the filesystem or IPC in a `try/catch`.

### Rule 5 — Updates are always user-prompted
`autoUpdater.autoDownload` must always be `false`. Nothing downloads or installs without two explicit user confirmations — one to download, one to restart. This is enforced in `main.ts`.

### Rule 6 — All IDs are UUIDs
Use `crypto.randomUUID()` for all record IDs. No auto-incrementing numbers, no slugs as IDs.
Slugs are used for file names only and are derived from titles at save time.

---

## Architecture Decisions

These decisions were made deliberately and should not be changed without updating this file and `PROJECT_PLAN.md` with the reason.

### Why Electron?
Gives access to the native Windows filesystem through Node.js, lets us bundle the entire app as a single `.exe` installer, and shares the same rendering engine (Chromium) across all platforms for a consistent UI. It is also the same runtime Obsidian uses.

### Why Svelte?
Compiles to vanilla JavaScript at build time — no virtual DOM, no runtime library overhead. The reactive model maps cleanly to a filesystem-first app where state and files are closely linked. Same concept as what Obsidian's UI layer does, without adopting their custom framework.

### Why TypeScript?
The app is built around structured data relationships (Scene ↔ Character ↔ Location ↔ Lore). TypeScript enforces those shapes at write time, not when a writer loses work to a runtime crash. Same language as Obsidian's plugin API and codebase.

### Why CodeMirror 6?
Obsidian uses it. It handles Markdown syntax highlighting, keyboard shortcuts, and extensibility properly. A plain `<textarea>` cannot do any of this.

### Why public GitHub repo?
Makes the project eligible for **SignPath Foundation** free code signing, which eliminates Windows SmartScreen warnings for users — at zero cost. An open source writing tool has no secrets worth protecting anyway.

### Why Windows only (for now)?
macOS distribution requires notarization through Apple, which requires a paid Apple Developer account ($99/year). This can be added later. The codebase requires no changes to support macOS — it is a signing and distribution constraint only.

### Why a StorageAdapter interface?
To make the app's core logic platform-agnostic from day one. Obsidian solved this exact problem using the same pattern — they share a codebase between Electron (desktop) and Capacitor (mobile) by swapping the storage layer. Our adapters:
- `ElectronAdapter.ts` — Node.js `fs` (current)
- `WebAdapter.ts` — File System Access API (future, web version)
- `CapacitorAdapter.ts` — Capacitor Filesystem plugin (future, mobile)

---

## Coding Standards

### Naming

| Thing | Convention | Example |
|---|---|---|
| Files | kebab-case | `scene-editor.svelte` |
| TypeScript interfaces | PascalCase | `SceneMetadata` |
| TypeScript types | PascalCase | `SceneStatus` |
| Functions | camelCase | `readSceneFile()` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RECENT_PROJECTS` |
| Svelte components | PascalCase filename | `SceneEditor.svelte` |
| Svelte stores | camelCase | `activeScene` |

### JSDoc
Every exported function must have a JSDoc comment. Minimum: one-line description + `@param` and `@returns` where non-obvious.

```typescript
/**
 * Reads a scene's Markdown content from disk.
 * @param adapter - The active StorageAdapter instance
 * @param scenePath - Absolute path to the .md file
 * @returns The raw Markdown string, or null if the file does not exist
 */
export async function readSceneContent(
  adapter: StorageAdapter,
  scenePath: string
): Promise<string | null> {
  // ...
}
```

### Error handling
Every file I/O operation must be wrapped in try/catch and return a meaningful error — not just `console.error('error')`.

```typescript
// ✅ Correct
try {
  const content = await adapter.readFile(path);
  return content;
} catch (error) {
  console.error(`Failed to read scene at ${path}:`, error);
  return null;
}

// ❌ Wrong
const content = await adapter.readFile(path); // uncaught — will crash
```

### No magic numbers
```typescript
// ✅ Correct
const AUTOSAVE_DELAY_MS = 2000;
setTimeout(save, AUTOSAVE_DELAY_MS);

// ❌ Wrong
setTimeout(save, 2000);
```

### IDs
```typescript
// ✅ Correct — built into Node.js, no external library needed
const id = crypto.randomUUID();

// ❌ Wrong
const id = Date.now(); // not unique enough
const id = Math.random().toString(); // not a UUID
```

---

## Data Model Reference

All TypeScript interfaces are defined in `src-shared/types.ts`. This is the single source of truth for data shapes.

### SceneMetadata
```typescript
interface SceneMetadata {
  id: string;                        // UUID v4
  title: string;
  order: number;                     // manuscript order (1-based)
  act: number;                       // act number (1, 2, 3...)
  chapter: number | null;
  status: 'draft' | 'revise' | 'final';
  pov: string | null;                // character slug
  characters: string[];              // character slugs
  location: string | null;           // location slug
  inWorldDate: string | null;        // free text, e.g. "Year 1, Day 12"
  tags: string[];
  wordCount: number;                 // updated on save
  createdAt: string;                 // ISO 8601
  updatedAt: string;                 // ISO 8601
}
```

### CharacterMetadata
```typescript
interface CharacterMetadata {
  id: string;                        // UUID v4
  slug: string;                      // derived from name, used in file names and cross-references
  name: string;
  aliases: string[];
  tags: string[];
  firstAppearance: string | null;    // scene ID
  createdAt: string;
  updatedAt: string;
}
```

### LocationMetadata
```typescript
interface LocationMetadata {
  id: string;
  slug: string;
  name: string;
  tags: string[];
  mapImage: string | null;           // relative path to image in /assets/
  createdAt: string;
  updatedAt: string;
}
```

### ProjectMetadata (`project.json`)
```typescript
interface ProjectMetadata {
  id: string;
  title: string;
  author: string;
  formatVersion: string;             // e.g. "1.0" — for future migration handling
  created: string;
  lastOpened: string;
  settings: {
    targetWordCount: number | null;
    defaultStatus: 'draft' | 'revise' | 'final';
    uiMode: 'beginner' | 'advanced';
  };
}
```

### File naming convention
```
/scenes/
  {slug}.md       ← Markdown content
  {slug}.json     ← SceneMetadata

/characters/
  {slug}.md       ← Character sheet Markdown
  {slug}.json     ← CharacterMetadata

/locations/
  {slug}.md
  {slug}.json
```

**Slug rules:** lowercase, hyphens only, no spaces, no special characters.
Example: `"The Crossing at Thornhaven"` → `the-crossing-at-thornhaven`

---

## StorageAdapter Pattern

### The interface (`src-shared/storage/StorageAdapter.ts`)
```typescript
export interface StorageAdapter {
  /** Read a file's full text content */
  readFile(path: string): Promise<string>;

  /** Write text content to a file, creating it if it does not exist */
  writeFile(path: string, content: string): Promise<void>;

  /** List all file paths in a directory (non-recursive) */
  listFiles(directory: string): Promise<string[]>;

  /** Delete a file */
  deleteFile(path: string): Promise<void>;

  /** Check whether a file or directory exists */
  exists(path: string): Promise<boolean>;

  /** Create a directory and any missing parent directories */
  createDirectory(path: string): Promise<void>;
}
```

### The Electron implementation (`src-shared/storage/ElectronAdapter.ts`)
This is the **only** file in the codebase that imports `fs`. It implements every method above using Node.js `fs/promises`.

### How to add a future platform
1. Create a new file: `src-shared/storage/WebAdapter.ts` (or `CapacitorAdapter.ts`)
2. Implement all methods in the `StorageAdapter` interface for that platform
3. Inject it at app startup instead of `ElectronAdapter`
4. No other file changes required

### Injection point
The adapter instance is created in `main.ts` (Electron) and passed to the renderer via IPC, or injected into `fileModel.ts` directly. The specific injection pattern will be documented here once Phase 0 implements it.

---

## Update Pipeline

Updates are delivered through **GitHub Releases** and are always **user-prompted**. Nothing downloads or installs without explicit user permission.

### The flow
```
Developer pushes a version tag → GitHub Actions builds the app →
electron-builder packages the .exe → SignPath Foundation signs it →
installer + latest.yml published to GitHub Release

User opens the app → silently checks latest.yml on GitHub →
if newer version found → dialog: "Download now?" →
user clicks Yes → download runs with progress indicator →
download complete → dialog: "Restart now or install later?" →
user chooses → done
```

### Key settings in `main.ts`
```typescript
autoUpdater.autoDownload = false;        // NEVER change this to true
autoUpdater.autoInstallOnAppQuit = false; // user controls install timing
```

### Versioning
This project follows **Semantic Versioning** (`MAJOR.MINOR.PATCH`):
- `PATCH` (e.g. `1.0.1`) — bug fixes only
- `MINOR` (e.g. `1.1.0`) — new features, backward compatible
- `MAJOR` (e.g. `2.0.0`) — breaking changes to the project file format

---

## Release Process (Step by Step)

Do this in order every time. Do not skip steps.

1. Make sure all work is committed on `dev` and tests pass
2. Merge `dev` → `main`:
   ```bash
   git checkout main
   git merge dev
   ```
3. Update `version` in `package.json` (e.g. `1.0.0` → `1.1.0`)
4. Update `CHANGELOG.md` — add a new section at the top:
   ```
   ## v1.1.0 — YYYY-MM-DD
   ### Added
   - ...
   ### Fixed
   - ...
   ### Changed
   - ...
   ```
5. Update the `Current Version` field at the top of this file
6. Commit:
   ```bash
   git add package.json CHANGELOG.md DEV_NOTES.md
   git commit -m "chore: release v1.1.0"
   ```
7. Tag:
   ```bash
   git tag v1.1.0
   ```
8. Push everything:
   ```bash
   git push origin main
   git push origin v1.1.0
   ```
9. GitHub Actions triggers automatically — watch the Actions tab to confirm it succeeds
10. After the workflow completes, confirm the new release appears in the GitHub Releases page with the `.exe` and `latest.yml` attached
11. Merge `main` back into `dev` to keep them in sync:
    ```bash
    git checkout dev
    git merge main
    git push origin dev
    ```

---

## Off-Limits Files

Never manually edit these files. They are either auto-generated or managed by tools.

| File / Directory | Reason |
|---|---|
| `/dist/` | Build output from electron-builder — regenerated on every build |
| `package-lock.json` | Managed by npm — only changed by `npm install` / `npm ci` |
| `latest.yml` | Generated by electron-builder and published to GitHub Releases — the update checker reads this |

---

## Start Here — Returning to the Codebase

If you are returning after a break (a day, a week, a month), do this before writing any code:

1. **Read this file top to bottom** — check if anything has changed since you last worked on it
2. **Read `CHANGELOG.md`** — what was the last thing built? What changed?
3. **Check the current phase** — it is listed at the top of this file
4. **Open GitHub Issues** — filter by the current phase milestone to see what is open
5. **Pick one Issue** — do not start work without knowing which Issue you are addressing
6. **Create a feature branch** off `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```
7. **Write code, commit often** with meaningful messages:
   ```bash
   git commit -m "feat: add scene drag-to-reorder in sidebar"
   git commit -m "fix: word count not updating after paste"
   git commit -m "refactor: extract scene save logic into fileModel"
   ```
8. **Open a pull request** from your feature branch into `dev` when done

---

## Current Known Issues & TODOs

> Keep this section updated as you discover issues. Move items to GitHub Issues when you have time to give them proper labels and milestone assignments.

*(none yet — project not started)*

---

## Decision Log

A running log of significant decisions made during development, with the reason. This helps when you return months later and wonder "why did I do it this way?"

| Date | Decision | Reason |
|---|---|---|
| (project start) | TypeScript over JavaScript | Type safety for complex data relationships; same as Obsidian; AI assistance is more reliable with typed code |
| (project start) | Svelte over React/Vue | Compiles away at build time; cleaner reactive model for filesystem-first state; lower overhead |
| (project start) | StorageAdapter pattern | Enables future web/mobile without rewriting app logic; same pattern Obsidian uses |
| (project start) | Windows only for now | macOS notarization requires $99/year Apple Developer account |
| (project start) | Public GitHub repo | Enables free code signing via SignPath Foundation |
| (project start) | User-prompted updates | Writers should never be surprised by an update mid-session |
| (project start) | CodeMirror 6 | Same editor as Obsidian; handles Markdown properly; extensible |
| (project start) | File System as database | No proprietary lock-in; works with Obsidian, VS Code, any text editor |

---

*Update this file whenever an architectural decision changes, a new pattern is adopted, or a phase is completed.*
