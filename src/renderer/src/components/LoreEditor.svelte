<script lang="ts">
  import { appState } from '../stores/app'
  import { onMount, onDestroy } from 'svelte'
  import { EditorState, RangeSetBuilder } from '@codemirror/state'
  import { EditorView, keymap, drawSelection, Decoration } from '@codemirror/view'
  import { defaultKeymap, historyKeymap, history } from '@codemirror/commands'
  import { markdown } from '@codemirror/lang-markdown'
  import { languages } from '@codemirror/language-data'
  import { ViewPlugin, type ViewUpdate } from '@codemirror/view'
  import { loreState } from '../stores/lore'
  import { charactersState } from '../stores/characters'
  import { locationsState } from '../stores/locations'

  export let loreId: string

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
      await window.api.saveLore(loreId, content)
      isSaving = false
    }, AUTOSAVE_DELAY_MS)
  }

  /** Highlight [[wikilinks]] in the editor */
  const wikilinkMark = Decoration.mark({ class: 'cm-wikilink' })

  const wikilinkPlugin = ViewPlugin.fromClass(
    class {
      decorations

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view)
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view)
        }
      }

      buildDecorations(view: EditorView) {
        const builder = new RangeSetBuilder()
        const pattern = /\[\[([^\]]+)\]\]/g
        for (const { from, to } of view.visibleRanges) {
          const text = view.state.doc.sliceString(from, to)
          let match
          while ((match = pattern.exec(text)) !== null) {
            builder.add(from + match.index, from + match.index + match[0].length, wikilinkMark)
          }
        }
        return builder.finish()
      }
    },
    { decorations: v => v.decorations }
  )

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
    '.cm-wikilink': {
      color: 'var(--color-accent)',
      backgroundColor: 'var(--color-accent-subtle)',
      borderRadius: '3px',
      padding: '0 2px',
    },
  }, { dark: true })

  onMount(async () => {
    const content = await window.api.readLore(loreId)
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
        wikilinkPlugin,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            scheduleSave(update.state.doc.toString())
          }
        }),
        EditorView.lineWrapping,

        EditorView.domEventHandlers({
            click(event, view) {
                const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
                if (pos === null) return false

                const doc = view.state.doc.toString()
                const before = doc.lastIndexOf('[[', pos)
                const after = doc.indexOf(']]', pos)
                if (before === -1 || after === -1 || before >= pos || after < pos) return false

                const slug = doc.slice(before + 2, after).trim().toLowerCase()

                // Check lore pages first
                let foundLoreId: string | null = null
                const unsubLore = loreState.subscribe(state => {
                const found = state.pages.find(p => p.slug === slug)
                if (found) foundLoreId = found.id
                })
                unsubLore()
                if (foundLoreId) {
                appState.update(s => ({ ...s, activeLoreId: foundLoreId }))
                return true
                }

                // Check characters
                let foundCharId: string | null = null
                const unsubChar = charactersState.subscribe(state => {
                const found = state.characters.find(c => c.slug === slug)
                if (found) foundCharId = found.id
                })
                unsubChar()
                if (foundCharId) {
                appState.update(s => ({ ...s, activeSection: 'characters', activeCharacterId: foundCharId }))
                return true
                }

                // Check locations
                let foundLocId: string | null = null
                const unsubLoc = locationsState.subscribe(state => {
                const found = state.locations.find(l => l.slug === slug)
                if (found) foundLocId = found.id
                })
                unsubLoc()
                if (foundLocId) {
                appState.update(s => ({ ...s, activeSection: 'locations', activeLocationId: foundLocId }))
                return true
                }

                return false
            }
            }),
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
      <span class="wikilink-hint">Use [[page-slug]] to link to other lore pages</span>
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
    justify-content: space-between;
    padding: 0 var(--space-lg);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .wikilink-hint {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-faint);
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