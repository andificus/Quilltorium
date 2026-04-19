<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { EditorState } from '@codemirror/state'
  import { EditorView, keymap, lineNumbers, drawSelection } from '@codemirror/view'
  import { defaultKeymap, historyKeymap, history } from '@codemirror/commands'
  import { markdown } from '@codemirror/lang-markdown'
  import { languages } from '@codemirror/language-data'
  import { scenesState } from '../stores/scenes'

  export let sceneId: string

  let editorContainer: HTMLDivElement
  let editorView: EditorView | null = null
  let saveTimeout: ReturnType<typeof setTimeout> | null = null
  let currentWordCount = 0
  let isSaving = false
  let isLoading = true

  /** Debounced save — waits 2 seconds after last keystroke */
  const AUTOSAVE_DELAY_MS = 2000

  /** Count words in a string */
  function countWords(text: string): number {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
  }

  /** Schedule a save after the user stops typing */
  function scheduleSave(content: string): void {
    if (saveTimeout) clearTimeout(saveTimeout)
    currentWordCount = countWords(content)
    saveTimeout = setTimeout(async () => {
      isSaving = true
      const wordCount = await window.api.saveScene(sceneId, content)
      // Update word count in the scenes store
      scenesState.update(s => ({
        ...s,
        scenes: s.scenes.map(scene =>
          scene.id === sceneId ? { ...scene, wordCount } : scene
        )
      }))
      isSaving = false
    }, AUTOSAVE_DELAY_MS)
  }

  /** Build the Quilltorium editor theme */
  const quilltoriumTheme = EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '16px',
      fontFamily: 'var(--font-display)',
      backgroundColor: 'transparent',
    },
    '.cm-scroller': {
      overflow: 'auto',
      padding: '40px 0',
      fontFamily: 'var(--font-display)',
      lineHeight: '1.8',
    },
    '.cm-content': {
      maxWidth: '680px',
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
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: 'var(--color-accent-subtle)',
    },
  }, { dark: true })

  onMount(async () => {
  const content = await window.api.readScene(sceneId)
  currentWordCount = countWords(content)
  isLoading = false

  // Wait for the DOM to update after isLoading = false
  await new Promise(resolve => setTimeout(resolve, 0))

  if (!editorContainer) {
    console.error('Editor container not found after loading')
    return
  }

  const state = EditorState.create({
    doc: content,
    extensions: [
      history(),
      drawSelection(),
      markdown({ codeLanguages: languages }),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      quilltoriumTheme,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          scheduleSave(update.state.doc.toString())
        }
      }),
      EditorView.lineWrapping,
    ]
  })

  editorView = new EditorView({
    state,
    parent: editorContainer
  })

  editorView.focus()
})

  onDestroy(() => {
    if (saveTimeout) clearTimeout(saveTimeout)
    editorView?.destroy()
  })
</script>

<div class="editor-wrapper">
  {#if isLoading}
    <div class="editor-loading">Loading...</div>
  {:else}
    <div class="editor-topbar">
      <span class="word-count">
        {currentWordCount.toLocaleString()} {currentWordCount === 1 ? 'word' : 'words'}
      </span>
      {#if isSaving}
        <span class="save-status saving">Saving...</span>
      {:else}
        <span class="save-status saved">Saved</span>
      {/if}
    </div>
    <div class="editor-container" bind:this={editorContainer}></div>
  {/if}
</div>

<style>
  .editor-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--color-bg);
  }

  .editor-loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-faint);
    font-family: var(--font-ui);
    font-size: 13px;
  }

  .editor-topbar {
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-md);
    padding: 0 var(--space-lg);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .word-count {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-muted);
  }

  .save-status {
    font-family: var(--font-ui);
    font-size: 11px;
  }

  .save-status.saving { color: var(--color-accent); }
  .save-status.saved  { color: var(--color-text-faint); }

  .editor-container {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .editor-container :global(.cm-editor) {
    height: 100%;
  }
</style>