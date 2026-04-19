<script lang="ts">
  import { onMount } from 'svelte'
  import { charactersState, loadCharacters, createCharacter, deleteCharacter } from '../stores/characters'
  import { appState } from '../stores/app'
  import type { CharacterMetadata } from '../env'

  onMount(() => {
    loadCharacters()
  })

  let isAddingCharacter = false
  let newCharacterName = ''
  let contextMenu: { x: number; y: number; character: CharacterMetadata } | null = null

  function handleAddCharacter(): void {
    isAddingCharacter = true
    newCharacterName = ''
  }

  async function handleConfirmAdd(): Promise<void> {
    if (newCharacterName.trim() === '') {
      isAddingCharacter = false
      return
    }
    const character = await createCharacter(newCharacterName.trim())
    if (character) {
      appState.update(s => ({ ...s, activeCharacterId: character.id }))
    }
    isAddingCharacter = false
    newCharacterName = ''
  }

  function handleCancelAdd(): void {
    isAddingCharacter = false
    newCharacterName = ''
  }

  function handleAddKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') handleConfirmAdd()
    if (e.key === 'Escape') handleCancelAdd()
  }

  function handleContextMenu(e: MouseEvent, character: CharacterMetadata): void {
    contextMenu = { x: e.clientX, y: e.clientY, character }
  }

  function closeContextMenu(): void {
    contextMenu = null
  }

  function setActiveCharacter(id: string): void {
    appState.update(s => ({ ...s, activeCharacterId: id }))
  }
</script>

<div class="character-sidebar">
  <div class="sidebar-header">
    <span class="sidebar-title">Characters</span>
    <button class="btn-add" on:click={handleAddCharacter} title="New character">+</button>
  </div>

  <div class="character-list">
    {#if $charactersState.loading}
      <div class="empty-state">Loading...</div>
    {:else if $charactersState.characters.length === 0 && !isAddingCharacter}
      <div class="empty-state">
        <p>No characters yet.</p>
        <p>Click + to add your first character.</p>
      </div>
    {:else}
      {#each $charactersState.characters as character (character.id)}
        <div
          class="character-item"
          class:active={$appState.activeCharacterId === character.id}
          on:click={() => setActiveCharacter(character.id)}
          on:contextmenu|preventDefault={(e) => handleContextMenu(e, character)}
        >
          <span class="character-avatar">
            {character.name.charAt(0).toUpperCase()}
          </span>
          <span class="character-name">{character.name}</span>
        </div>
      {/each}
    {/if}

    {#if isAddingCharacter}
      <div class="character-input-row">
        <input
          type="text"
          placeholder="Character name..."
          bind:value={newCharacterName}
          on:keydown={handleAddKeydown}
          autofocus
        />
        <button class="btn-confirm" on:click={handleConfirmAdd}>✓</button>
        <button class="btn-cancel" on:click={handleCancelAdd}>✕</button>
      </div>
    {/if}
  </div>
</div>

{#if contextMenu}
  <div class="context-backdrop" on:click={closeContextMenu}></div>
  <div
    class="context-menu"
    style="left: {contextMenu.x}px; top: {contextMenu.y}px"
  >
    <button
      class="context-item context-delete"
      on:click={async () => {
        const character = contextMenu?.character
        contextMenu = null
        if (character) {
          if ($appState.activeCharacterId === character.id) {
            appState.update(s => ({ ...s, activeCharacterId: null }))
          }
          await deleteCharacter(character.id)
        }
      }}
    >
      Delete "{contextMenu.character.name}"
    </button>
  </div>
{/if}

<style>
  .character-sidebar {
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

  .character-list {
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

  .character-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 8px 12px;
    cursor: pointer;
    transition: background 0.1s;
    border-left: 2px solid transparent;
    user-select: none;
  }

  .character-item:hover { background: var(--color-surface-hover); }

  .character-item.active {
    background: var(--color-accent-subtle);
    border-left-color: var(--color-accent);
  }

  .character-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-accent-subtle);
    border: 1px solid var(--color-accent);
    color: var(--color-accent);
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .character-name {
    flex: 1;
    font-family: var(--font-ui);
    font-size: 13px;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .character-input-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
  }

  .character-input-row input {
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

  .btn-confirm,
  .btn-cancel {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.15s;
    flex-shrink: 0;
  }

  .btn-confirm { color: var(--color-final); }
  .btn-confirm:hover { background: var(--color-accent-subtle); }
  .btn-cancel { color: var(--color-text-muted); }
  .btn-cancel:hover { background: var(--color-surface-hover); }

  .context-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
  }

  .context-menu {
    position: fixed;
    z-index: 101;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 4px;
    min-width: 180px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  .context-item {
    width: 100%;
    padding: 8px 12px;
    background: none;
    border: none;
    border-radius: 4px;
    text-align: left;
    font-family: var(--font-ui);
    font-size: 13px;
    cursor: pointer;
    color: var(--color-text);
  }

  .context-delete { color: #e06c6c; }
  .context-delete:hover { background: rgba(224, 108, 108, 0.1); }
</style>