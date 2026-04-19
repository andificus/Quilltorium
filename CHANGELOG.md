# Changelog

All notable changes to Quilltorium will be documented here.

This project follows [Semantic Versioning](https://semver.org/).

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