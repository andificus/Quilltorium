<script lang="ts">
  import { onMount } from 'svelte'
  import { loreState } from '../stores/lore'
  import type { LoreMetadata } from '../env'

  export let loreId: string

  $: page = $loreState.pages.find(p => p.id === loreId) ?? null

  let backlinks: LoreMetadata[] = []
  let loadingBacklinks = false

  $: if (page) loadBacklinks(page.slug)

  async function loadBacklinks(slug: string): Promise<void> {
    loadingBacklinks = true
    backlinks = await window.api.getLoreBacklinks(slug)
    loadingBacklinks = false
  }

  async function updateField(
    field: keyof LoreMetadata,
    value: LoreMetadata[typeof field]
  ): Promise<void> {
    await window.api.updateLoreMetadata(loreId, { [field]: value })
    loreState.update(s => ({
      ...s,
      pages: s.pages.map(p =>
        p.id === loreId ? { ...p, [field]: value } : p
      ).sort((a, b) => a.title.localeCompare(b.title))
    }))
  }

  let newTag = ''

  function handleTagKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') addTag()
    if (e.key === 'Escape') newTag = ''
  }

  async function addTag(): Promise<void> {
    const tag = newTag.trim().toLowerCase()
    if (!tag || !page) return
    if (page.tags.includes(tag)) { newTag = ''; return }
    await updateField('tags', [...page.tags, tag])
    newTag = ''
  }

  async function removeTag(tag: string): Promise<void> {
    if (!page) return
    await updateField('tags', page.tags.filter(t => t !== tag))
  }

  function navigateTo(targetId: string): void {
    import('../stores/app').then(({ appState }) => {
      appState.update(s => ({ ...s, activeLoreId: targetId }))
    })
  }
</script>

{#if page}
  <div class="metadata-panel">
    <div class="panel-header">
      <span class="panel-title">Lore Info</span>
    </div>

    <div class="panel-body">

      <div class="field">
        <label for="lore-title">Title</label>
        <input
          id="lore-title"
          type="text"
          value={page.title}
          on:change={(e) => updateField('title', e.currentTarget.value)}
        />
      </div>

      <div class="field">
        <label>Slug</label>
        <span class="slug-value">{page.slug}</span>
        <p class="field-hint">Use [[{page.slug}]] to link here from other lore pages</p>
      </div>

      <div class="field">
        <label>Tags</label>
        <div class="tags-container">
          {#each page.tags as tag}
            <span class="tag">
              {tag}
              <button class="tag-remove" on:click={() => removeTag(tag)}>×</button>
            </span>
          {/each}
          <input
            class="tag-input"
            type="text"
            placeholder="Add tag..."
            bind:value={newTag}
            on:keydown={handleTagKeydown}
            on:blur={addTag}
          />
        </div>
      </div>

      <div class="field">
        <label>Backlinks</label>
        {#if loadingBacklinks}
          <p class="empty-hint">Loading...</p>
        {:else if backlinks.length === 0}
          <p class="empty-hint">No other lore pages link here yet.</p>
        {:else}
          <div class="backlink-list">
            {#each backlinks as link}
              <button
                class="backlink-item"
                on:click={() => navigateTo(link.id)}
              >
                <span class="backlink-icon">📜</span>
                <span class="backlink-title">{link.title}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>

    </div>
  </div>
{/if}

<style>
  .metadata-panel {
    width: 220px;
    height: 100%;
    background: var(--color-surface);
    border-left: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow-y: auto;
  }

  .panel-header {
    height: 36px;
    display: flex;
    align-items: center;
    padding: 0 var(--space-md);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .panel-title {
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .panel-body {
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  label {
    font-family: var(--font-ui);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
  }

  input {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 6px 8px;
    color: var(--color-text);
    font-family: var(--font-ui);
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
  }

  input:focus { border-color: var(--color-accent); }

  .slug-value {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-accent);
    background: var(--color-accent-subtle);
    padding: 4px 8px;
    border-radius: 4px;
  }

  .field-hint {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-faint);
    margin: 0;
    line-height: 1.5;
  }

  .empty-hint {
    font-family: var(--font-ui);
    font-size: 11px;
    color: var(--color-text-faint);
    margin: 0;
  }

  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 4px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    min-height: 32px;
    align-items: center;
  }

  .tags-container:focus-within { border-color: var(--color-accent); }

  .tag {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 2px 6px;
    background: var(--color-accent-subtle);
    border: 1px solid var(--color-accent);
    border-radius: 3px;
    font-family: var(--font-ui);
    font-size: 11px;
    color: var(--color-accent);
  }

  .tag-remove {
    background: none;
    border: none;
    color: var(--color-accent);
    cursor: pointer;
    padding: 0;
    font-size: 14px;
    line-height: 1;
    opacity: 0.7;
  }

  .tag-remove:hover { opacity: 1; }

  .tag-input {
    flex: 1;
    min-width: 60px;
    background: none;
    border: none;
    padding: 2px 4px;
    color: var(--color-text);
    font-family: var(--font-ui);
    font-size: 12px;
    outline: none;
  }

  .backlink-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .backlink-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    transition: border-color 0.15s;
    text-align: left;
    width: 100%;
  }

  .backlink-item:hover { border-color: var(--color-accent); }
  .backlink-icon { font-size: 12px; }

  .backlink-title {
    font-family: var(--font-ui);
    font-size: 12px;
    color: var(--color-text);
  }
</style>