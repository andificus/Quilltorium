# Changelog

All notable changes to Quilltorium will be documented here.

This project follows [Semantic Versioning](https://semver.org/).

---

## v0.3.0 — 2026-04-20

### Added
- Recent projects list on welcome screen with click-to-open
- Project settings panel (title, author, word count goal)
- Word count goal now reads from project settings in Stats panel
- Manuscript export modal with status filter and scene title toggle
- Timeline view with manuscript and chronological modes
- Lore wiki with [[wikilink]] highlighting and backlinks panel
- Wikilinks navigate to lore pages, characters, and locations
- Notes inbox with quick capture and promote to scene/character/location/lore
- Fix Node.js 24 in GitHub Actions workflow


---

## v0.2.0 — 2026-04-19

### Added
- Character section with list sidebar, avatar initials, add/delete, and Markdown editor
- Character metadata panel with name, aliases, tags, and scene appearance tracking
- Location section with list sidebar, add/delete, and Markdown editor
- Location metadata panel with name, tags, and scene appearance tracking
- Plot board view showing scenes grouped by act columns
- Mouse-drag to move scenes between acts on the plot board
- Hover buttons on plot board cards as a fallback for moving between acts
- Scene metadata panel now has character multi-select dropdown linked to real character data
- Scene metadata panel now has location dropdown linked to real location data
- POV character field is now a dropdown from the characters list
- Characters and locations load automatically when a project is opened
- Plot section added to navigation rail

---

## v0.1.0 — 2026-04-18

### Added
- App layout with dark theme, navigation rail, and welcome screen
- Project create and open flow with native folder dialogs
- Scene list sidebar with add, delete, and drag-to-reorder
- CodeMirror 6 Markdown editor with 2-second autosave
- Scene metadata panel (status, POV, act, in-world date, tags)
- Writing statistics panel with word count and progress tracking
- Manuscript export to .docx with title page and scene headings
- Close project button in title bar
- Export button in title bar

### Infrastructure
- Initial repository setup
- Electron + TypeScript + Svelte boilerplate
- StorageAdapter interface and ElectronAdapter implementation
- Shared TypeScript types for all data models
- electron-builder configured for Windows
- electron-updater wired with user-prompted update flow
- GitHub Actions build and release workflow
- package.json updated with correct project metadata

---

*Older versions will be listed below as releases are made.*