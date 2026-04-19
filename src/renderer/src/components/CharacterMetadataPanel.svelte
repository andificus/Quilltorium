<script lang="ts">
  import { charactersState } from '../stores/characters'
  import { scenesState } from '../stores/scenes'
  import { appState, setActiveScene, setActiveSection } from '../stores/app'
  import type { CharacterMetadata } from '../env'

  export let characterId: string

  $: character = $charactersState.characters.find(c => c.id === characterId) ?? null

  /** Scenes this character appears in */
  $: appearsIn = $scenesState.scenes.filter(s =>
    s.characters.includes(character?.slug ?? '')
  )

  async function updateField(
    field: keyof CharacterMetadata,
    value: CharacterMetadata[typeof field]
  ): Promise<void> {
    await window.api.updateCharacterMetadata(characterId, { [field]: value })
    charactersState.update(s => ({
      ...s,
      characters: s.characters.map(c =>
        c.id === characterId ? { ...c, [field]: value } : c
      ).sort((a, b) => a.name.localeCompare(b.name))
    }))
  }

  /** Alias input */
  let newAlias = ''

  function handleAliasKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') addAlias()
    if (e.key === 'Escape') newAlias = ''
  }

  async function addAlias(): Promise<void> {
    const alias = newAlias.trim()
    if (!alias || !character) return
    if (character.aliases.includes(alias)) { newAlias = ''; return }
    await updateField('aliases', [...character.aliases, alias])
    newAlias = ''
  }

  async function removeAlias(alias: string): Promise<void> {
    if (!character) return
    await updateField('aliases', character.aliases.filter(a => a !== alias))
  }

  /** Tag input */
  let newTag = ''

  function handleTagKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') addTag()
    if (e.key === 'Escape') newTag = ''
  }

  async function addTag(): Promise<void> {
    const tag = newTag.trim().toLowerCase()
    if (!tag || !character) return
    if (character.tags.includes(tag)) { newTag = ''; return }
    await updateField('tags', [...character.tags, tag])
    newTag = ''
  }

  async function removeTag(tag: string): Promise<void> {
    if (!character) return
    await updateField('tags', character.tags.filter(t => t !== tag))
  }

  /** Navigate to a scene */
  function goToScene(sceneId: string): void {
    setActiveSection('scenes')
    setActiveScene(sceneId)
  }
</script>

{#if character}
  <div class="metadata-panel">
    <div class="panel-header">
      <span class="panel-title">Character Info</span>
    </div>

    <div class="panel-body">

      <!-- Name -->
      <div class="field">
        <label for="char-name">Name</label>
        <input
          id="char-name"
          type="text"
          value={character.name}
          on:change={(e) => updateField('name', e.currentTarget.value)}
        />
      </div>

      <!-- Aliases -->
      <div class="field">
        <label>Aliases</label>
        <div class="tags-container">
          {#each character.aliases as alias}
            <span class="tag">
              {alias}
              <button class="tag-remove" on:click={() => removeAlias(alias)}>×</button>
            </span>
          {/each}
          <input
            class="tag-input"
            type="text"
            placeholder="Add alias..."
            bind:value={newAlias}
            on:keydown={handleAliasKeydown}
            on:blur={addAlias}
          />
        </div>
      </div>

      <!-- Tags -->
      <div class="field">
        <label>Tags</label>
        <div class="tags-container">
          {#each character.tags as tag}
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

      <!-- Appears in -->
      <div class="field">
        <label>Appears In</label>
        {#if appearsIn.length === 0}
          <p class="empty-hint">
            Not linked to any scenes yet. Add this character to a scene via the Scene Info panel.
          </p>
        {:else}
          <div class="scene-links">
            {#each appearsIn as scene}
              <button
                class="scene-link"
                on:click={() => goToScene(scene.id)}
              >
                <span
                  class="scene-status-dot"
                  style="background: var(--color-{scene.status})"
                ></span>
                <span class="scene-link-title">{scene.title}</span>
                <span class="scene-link-words">{scene.wordCount}w</span>
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

  .empty-hint {
    font-family: var(--font-ui);
    font-size: 11px;
    color: var(--color-text-faint);
    line-height: 1.5;
    margin: 0;
  }

  .scene-links {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .scene-link {
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

  .scene-link:hover { border-color: var(--color-accent); }

  .scene-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .scene-link-title {
    flex: 1;
    font-family: var(--font-ui);
    font-size: 12px;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .scene-link-words {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-faint);
    flex-shrink: 0;
  }
</style>