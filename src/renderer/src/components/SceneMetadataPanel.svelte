<script lang="ts">
  import { scenesState } from '../stores/scenes'
  import type { SceneMetadata } from '../env'

  export let sceneId: string

  /** Save a metadata update to disk and sync the store */
  async function updateField(
    field: keyof SceneMetadata,
    value: SceneMetadata[typeof field]
  ): Promise<void> {
    await window.api.updateSceneMetadata(sceneId, { [field]: value })
    scenesState.update(s => ({
      ...s,
      scenes: s.scenes.map(scene =>
        scene.id === sceneId ? { ...scene, [field]: value } : scene
      )
    }))
  }

  /** Get the current scene from the store */
  $: scene = $scenesState.scenes.find(s => s.id === sceneId) ?? null

  /** Tag input state */
  let newTag = ''

  function handleTagKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  async function addTag(): Promise<void> {
    const tag = newTag.trim().toLowerCase()
    if (!tag || !scene) return
    if (scene.tags.includes(tag)) { newTag = ''; return }
    await updateField('tags', [...scene.tags, tag])
    newTag = ''
  }

  async function removeTag(tag: string): Promise<void> {
    if (!scene) return
    await updateField('tags', scene.tags.filter(t => t !== tag))
  }
</script>

{#if scene}
  <div class="metadata-panel">
    <div class="panel-header">
      <span class="panel-title">Scene Info</span>
    </div>

    <div class="panel-body">

      <!-- Title -->
      <div class="field">
        <label for="scene-title">Title</label>
        <input
          id="scene-title"
          type="text"
          value={scene.title}
          on:change={(e) => updateField('title', e.currentTarget.value)}
        />
      </div>

      <!-- Status -->
      <div class="field">
        <label>Status</label>
        <div class="status-buttons">
          {#each ['draft', 'revise', 'final'] as status}
            <button
              class="status-btn"
              class:active={scene.status === status}
              data-status={status}
              on:click={() => updateField('status', status as SceneMetadata['status'])}
            >
              {status}
            </button>
          {/each}
        </div>
      </div>

      <!-- POV -->
      <div class="field">
        <label for="scene-pov">POV Character</label>
        <input
          id="scene-pov"
          type="text"
          placeholder="e.g. Kaelen"
          value={scene.pov ?? ''}
          on:change={(e) => updateField('pov', e.currentTarget.value || null)}
        />
      </div>

      <!-- Act -->
      <div class="field">
        <label for="scene-act">Act</label>
        <select
          id="scene-act"
          value={scene.act}
          on:change={(e) => updateField('act', parseInt(e.currentTarget.value))}
        >
          <option value={1}>Act 1</option>
          <option value={2}>Act 2</option>
          <option value={3}>Act 3</option>
        </select>
      </div>

      <!-- In-world date -->
      <div class="field">
        <label for="scene-date">In-World Date</label>
        <input
          id="scene-date"
          type="text"
          placeholder="e.g. Year 1, Day 12"
          value={scene.inWorldDate ?? ''}
          on:change={(e) => updateField('inWorldDate', e.currentTarget.value || null)}
        />
      </div>

      <!-- Word count (read only) -->
      <div class="field">
        <label>Word Count</label>
        <span class="readonly-value">
          {scene.wordCount.toLocaleString()} {scene.wordCount === 1 ? 'word' : 'words'}
        </span>
      </div>

      <!-- Tags -->
      <div class="field">
        <label>Tags</label>
        <div class="tags-container">
          {#each scene.tags as tag}
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

  input, select {
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

  input:focus, select:focus {
    border-color: var(--color-accent);
  }

  select {
    cursor: pointer;
  }

  .readonly-value {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-text-muted);
    padding: 6px 0;
  }

  .status-buttons {
    display: flex;
    gap: 4px;
  }

  .status-btn {
    flex: 1;
    padding: 5px 4px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    color: var(--color-text-muted);
    font-family: var(--font-ui);
    font-size: 11px;
    cursor: pointer;
    text-transform: capitalize;
    transition: all 0.15s;
  }

  .status-btn:hover {
    border-color: var(--color-text-muted);
    color: var(--color-text);
  }

  .status-btn[data-status="draft"].active {
    background: var(--color-draft);
    border-color: var(--color-draft);
    color: var(--color-bg);
  }

  .status-btn[data-status="revise"].active {
    background: var(--color-revise);
    border-color: var(--color-revise);
    color: var(--color-bg);
  }

  .status-btn[data-status="final"].active {
    background: var(--color-final);
    border-color: var(--color-final);
    color: var(--color-bg);
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

  .tags-container:focus-within {
    border-color: var(--color-accent);
  }

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
</style>