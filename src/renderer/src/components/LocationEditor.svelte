<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { EditorState } from '@codemirror/state'
  import { EditorView, keymap, drawSelection } from '@codemirror/view'
  import { defaultKeymap, historyKeymap, history } from '@codemirror/commands'
  import { markdown } from '@codemirror/lang-markdown'
  import { languages } from '@codemirror/language-data'

  export let locationId: string

  let editorContainer: HTMLDivElement
  let editorView: EditorView | null = null
  let saveTimeout: ReturnType<typeof setTimeout> | null = null
  let isSaving = false
  let isLoading = true

  const AUTOSAVE_DELAY_MS = 2000

  function scheduleSave(content: string): void {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(async () => {
      isSaving = true
      await window.api.saveLocation(locationId, content)
      isSaving = false
    }, AUTOSAVE_DELAY_MS)
  }

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
    const content = await window.api.readLocation(locationId)
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
          if (update.docChanged) {
            scheduleSave(update.state.doc.toString())
          }
        }),
        EditorView.lineWrapping,
      ]
    })

    editorView = new EditorView({ state, parent: editorContainer })
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
    padding: 0 var(--space-lg);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .save-status { font-family: var(--font-ui); font-size: 11px; }
  .save-status.saving { color: var(--color-accent); }
  .save-status.saved  { color: var(--color-text-faint); }

  .editor-container {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .editor-container :global(.cm-editor) { height: 100%; }
</style>