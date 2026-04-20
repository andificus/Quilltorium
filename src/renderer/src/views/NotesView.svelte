<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { EditorState } from '@codemirror/state'
  import { EditorView, keymap, drawSelection } from '@codemirror/view'
  import { defaultKeymap, historyKeymap, history } from '@codemirror/commands'
  import { markdown } from '@codemirror/lang-markdown'
  import { languages } from '@codemirror/language-data'
  import {
    notesState, loadNotes, createNote,
    removeNoteFromStore, updateNotePreview
  } from '../stores/notes'
  import { scenesState } from '../stores/scenes'
  import { charactersState } from '../stores/characters'
  import { locationsState } from '../stores/locations'
  import { loreState } from '../stores/lore'
  import { appState, setActiveSection, setActiveScene } from '../stores/app'
  import type { NoteMetadata } from '../env'

  onMount(() => { loadNotes() })

  let activeNoteId: string | null = null
  let editorContainer: HTMLDivElement
  let editorView: EditorView | null = null
  let saveTimeout: ReturnType<typeof setTimeout> | null = null
  let isSaving = false
  let isLoading = false
  let showPromoteMenu = false
  let promoteTitle = ''
  let promoteType: 'scene' | 'character' | 'location' | 'lore' | null = null

  $: activeNote = $notesState.notes.find(n => n.id === activeNoteId) ?? null

  const AUTOSAVE_DELAY_MS = 2000

  const quilltoriumTheme = EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '16px',
      fontFamily: 'var(--font-display)',
      backgroundColor: 'transparent',
    },
    '.cm-scroller': {
      overflow: 'auto',
      padding: '24px 0',
      fontFamily: 'var(--font-display)',
      lineHeight: '1.8',
    },
    '.cm-content': {
      maxWidth: '600px',
      margin: '0 auto',
      padding: '0 24px',
      caretColor: 'var(--color-accent)',
      color: 'var(--color-text)',
    },
    '.cm-focused': { outline: 'none' },
    '.cm-line': { padding: '0' },
    '.cm-cursor': {
      borderLeftColor: 'var(--color-accent)',
      borderLeftWidth: '2px',
    },
    '.cm-selectionBackground': {
      backgroundColor: 'var(--color-accent-subtle) !important',
    },
    '.cm-gutters': { display: 'none' },
  }, { dark: true })

  function scheduleSave(content: string): void {
    if (!activeNoteId) return
    if (saveTimeout) clearTimeout(saveTimeout)
    const firstLine = content.split('\n').find(l => l.trim() !== '') ?? 'Empty note'
    const preview = firstLine.replace(/^#+\s+/, '').slice(0, 60)
    updateNotePreview(activeNoteId, preview)
    saveTimeout = setTimeout(async () => {
      if (!activeNoteId) return
      isSaving = true
      await window.api.saveNote(activeNoteId, content)
      isSaving = false
    }, AUTOSAVE_DELAY_MS)
  }

  async function selectNote(note: NoteMetadata): Promise<void> {
    if (saveTimeout) clearTimeout(saveTimeout)
    editorView?.destroy()
    editorView = null
    activeNoteId = note.id
    isLoading = true
    showPromoteMenu = false

    const content = await window.api.readNote(note.id)
    isLoading = false

    await new Promise(resolve => setTimeout(resolve, 0))
    if (!editorContainer) return

    const state = EditorState.create({
      doc: content,
      extensions: [
        history(),
        drawSelection(),
        markdown({ codeLanguages: languages }),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        quilltoriumTheme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) scheduleSave(update.state.doc.toString())
        }),
        EditorView.lineWrapping,
      ]
    })

    editorView = new EditorView({ state, parent: editorContainer })
    editorView.focus()
  }

  async function handleNewNote(): Promise<void> {
    const note = await createNote()
    if (note) await selectNote(note)
  }

  async function handleDeleteNote(): Promise<void> {
    if (!activeNoteId) return
    const id = activeNoteId
    editorView?.destroy()
    editorView = null
    activeNoteId = null
    await window.api.deleteNote(id)
    removeNoteFromStore(id)
  }

  function startPromote(type: typeof promoteType): void {
    promoteType = type
    promoteTitle = activeNote?.preview ?? ''
    showPromoteMenu = false
  }

  async function confirmPromote(): Promise<void> {
    if (!activeNoteId || !promoteType || !promoteTitle.trim()) return
    const id = activeNoteId
    const title = promoteTitle.trim()

    editorView?.destroy()
    editorView = null
    activeNoteId = null

    if (promoteType === 'scene') {
      const scene = await window.api.promoteToScene(id, title)
      if (scene) {
        scenesState.update(s => ({
          ...s,
          scenes: [...s.scenes, scene].sort((a, b) => a.order - b.order)
        }))
        removeNoteFromStore(id)
        setActiveSection('scenes')
        setActiveScene(scene.id)
      }
    } else if (promoteType === 'character') {
      const character = await window.api.promoteToCharacter(id, title)
      if (character) {
        charactersState.update(s => ({
          ...s,
          characters: [...s.characters, character].sort((a, b) =>
            a.name.localeCompare(b.name))
        }))
        removeNoteFromStore(id)
        appState.update(s => ({ ...s, activeSection: 'characters', activeCharacterId: character.id }))
      }
    } else if (promoteType === 'location') {
      const location = await window.api.promoteToLocation(id, title)
      if (location) {
        locationsState.update(s => ({
          ...s,
          locations: [...s.locations, location].sort((a, b) =>
            a.name.localeCompare(b.name))
        }))
        removeNoteFromStore(id)
        appState.update(s => ({ ...s, activeSection: 'locations', activeLocationId: location.id }))
      }
    } else if (promoteType === 'lore') {
      const page = await window.api.promoteToLore(id, title)
      if (page) {
        loreState.update(s => ({
          ...s,
          pages: [...s.pages, page].sort((a, b) => a.title.localeCompare(b.title))
        }))
        removeNoteFromStore(id)
        appState.update(s => ({ ...s, activeSection: 'lore', activeLoreId: page.id }))
      }
    }

    promoteType = null
    promoteTitle = ''
  }

  function formatDate(iso: string): string {
    const date = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  onDestroy(() => {
    if (saveTimeout) clearTimeout(saveTimeout)
    editorView?.destroy()
  })
</script>

<div class="notes-view">
  <!-- Notes list sidebar -->
  <div class="notes-sidebar">
    <div class="sidebar-header">
      <span class="sidebar-title">Notes</span>
      <button class="btn-add" on:click={handleNewNote} title="New note">+</button>
    </div>

    <div class="notes-list">
      {#if $notesState.loading}
        <div class="empty-state">Loading...</div>
      {:else if $notesState.notes.length === 0}
        <div class="empty-state">
          <p>No notes yet.</p>
          <p>Click + to capture a quick idea.</p>
        </div>
      {:else}
        {#each $notesState.notes as note (note.id)}
          <div
            class="note-item"
            class:active={activeNoteId === note.id}
            on:click={() => selectNote(note)}
          >
            <span class="note-preview">{note.preview}</span>
            <span class="note-date">{formatDate(note.updatedAt)}</span>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  <!-- Note editor -->
  <div class="note-editor">
    {#if !activeNoteId}
      <div class="editor-placeholder">
        Select a note or click + to capture a new idea
      </div>
    {:else if isLoading}
      <div class="editor-placeholder">Loading...</div>
    {:else}
      <div class="note-toolbar">
        <div class="toolbar-left">
          {#if isSaving}
            <span class="save-status saving">Saving...</span>
          {:else}
            <span class="save-status saved">Saved</span>
          {/if}
        </div>
        <div class="toolbar-right">
          <!-- Promote menu -->
          <div class="promote-container">
            <button
              class="btn-promote"
              on:click={() => showPromoteMenu = !showPromoteMenu}
            >
              Promote to... ▾
            </button>
            {#if showPromoteMenu}
              <div class="promote-backdrop" on:click={() => showPromoteMenu = false}></div>
              <div class="promote-menu">
                <button class="promote-item" on:click={() => startPromote('scene')}>📄 Scene</button>
                <button class="promote-item" on:click={() => startPromote('character')}>👤 Character</button>
                <button class="promote-item" on:click={() => startPromote('location')}>🗺️ Location</button>
                <button class="promote-item" on:click={() => startPromote('lore')}>📚 Lore Page</button>
              </div>
            {/if}
          </div>
          <button class="btn-delete" on:click={handleDeleteNote} title="Delete note">🗑</button>
        </div>
      </div>

      <!-- Promote dialog -->
      {#if promoteType}
        <div class="promote-dialog">
          <span class="promote-label">
            Promoting to {promoteType} —
            {promoteType === 'scene' ? 'Scene title' : 'Name'}:
          </span>
          <input
            type="text"
            bind:value={promoteTitle}
            on:keydown={(e) => { if (e.key === 'Enter') confirmPromote() }}
            autofocus
          />
          <button class="btn-confirm-promote" on:click={confirmPromote}>
            Promote
          </button>
          <button class="btn-cancel-promote" on:click={() => promoteType = null}>
            Cancel
          </button>
        </div>
      {/if}

      <div class="editor-container" bind:this={editorContainer}></div>
    {/if}
  </div>
</div>

<style>
  .notes-view {
    flex: 1;
    display: flex;
    overflow: hidden;
    background: var(--color-bg);
  }

  .notes-sidebar {
    width: var(--sidebar-width);
    height: 100%;
    background: var(--color-surface);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .sidebar-header {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-md);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .sidebar-title {
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .btn-add {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    color: var(--color-text-muted);
    font-size: 16px;
    cursor: pointer;
    transition: all 0.15s;
    line-height: 1;
  }

  .btn-add:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .notes-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-sm) 0;
  }

  .empty-state {
    padding: var(--space-lg) var(--space-md);
    text-align: center;
    color: var(--color-text-faint);
    font-family: var(--font-ui);
    font-size: 12px;
    line-height: 1.6;
  }

  .empty-state p { margin: 0 0 4px; }

  .note-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 12px;
    cursor: pointer;
    transition: background 0.1s;
    border-left: 2px solid transparent;
  }

  .note-item:hover { background: var(--color-surface-hover); }

  .note-item.active {
    background: var(--color-accent-subtle);
    border-left-color: var(--color-accent);
  }

  .note-preview {
    font-family: var(--font-ui);
    font-size: 13px;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .note-date {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-faint);
  }

  .note-editor {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .editor-placeholder {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-faint);
    font-family: var(--font-ui);
    font-size: 13px;
  }

  .note-toolbar {
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-lg);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .toolbar-left, .toolbar-right {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .save-status { font-family: var(--font-ui); font-size: 11px; }
  .save-status.saving { color: var(--color-accent); }
  .save-status.saved { color: var(--color-text-faint); }

  .promote-container { position: relative; }

  .btn-promote {
    padding: 5px 12px;
    background: var(--color-accent-subtle);
    border: 1px solid var(--color-accent);
    border-radius: 4px;
    color: var(--color-accent);
    font-family: var(--font-ui);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-promote:hover {
    background: var(--color-accent);
    color: #1a1a1f;
  }

  .promote-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
  }

  .promote-menu {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 101;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 4px;
    min-width: 160px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  .promote-item {
    width: 100%;
    padding: 8px 12px;
    background: none;
    border: none;
    border-radius: 4px;
    text-align: left;
    font-family: var(--font-ui);
    font-size: 13px;
    color: var(--color-text);
    cursor: pointer;
    transition: background 0.1s;
  }

  .promote-item:hover { background: var(--color-surface-hover); }

  .btn-delete {
    background: none;
    border: none;
    font-size: 14px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.15s;
    opacity: 0.6;
  }

  .btn-delete:hover { background: rgba(224, 108, 108, 0.15); opacity: 1; }

  .promote-dialog {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 8px var(--space-lg);
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .promote-label {
    font-family: var(--font-ui);
    font-size: 12px;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .promote-dialog input {
    flex: 1;
    background: var(--color-bg);
    border: 1px solid var(--color-accent);
    border-radius: 4px;
    padding: 5px 8px;
    color: var(--color-text);
    font-family: var(--font-ui);
    font-size: 13px;
    outline: none;
  }

  .btn-confirm-promote {
    padding: 5px 12px;
    background: var(--color-accent);
    color: #1a1a1f;
    border: none;
    border-radius: 4px;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-cancel-promote {
    padding: 5px 12px;
    background: none;
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-family: var(--font-ui);
    font-size: 12px;
    cursor: pointer;
  }

  .editor-container {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .editor-container :global(.cm-editor) { height: 100%; }
</style>