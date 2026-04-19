<script lang="ts">
  import { onMount } from 'svelte'
  import { locationsState, loadLocations, createLocation, deleteLocation } from '../stores/locations'
  import { appState } from '../stores/app'
  import type { LocationMetadata } from '../env'

  onMount(() => {
    loadLocations()
  })

  let isAddingLocation = false
  let newLocationName = ''
  let contextMenu: { x: number; y: number; location: LocationMetadata } | null = null

  function handleAddLocation(): void {
    isAddingLocation = true
    newLocationName = ''
  }

  async function handleConfirmAdd(): Promise<void> {
    if (newLocationName.trim() === '') {
      isAddingLocation = false
      return
    }
    const location = await createLocation(newLocationName.trim())
    if (location) {
      appState.update(s => ({ ...s, activeLocationId: location.id }))
    }
    isAddingLocation = false
    newLocationName = ''
  }

  function handleCancelAdd(): void {
    isAddingLocation = false
    newLocationName = ''
  }

  function handleAddKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') handleConfirmAdd()
    if (e.key === 'Escape') handleCancelAdd()
  }

  function handleContextMenu(e: MouseEvent, location: LocationMetadata): void {
    contextMenu = { x: e.clientX, y: e.clientY, location }
  }

  function closeContextMenu(): void {
    contextMenu = null
  }

  function setActiveLocation(id: string): void {
    appState.update(s => ({ ...s, activeLocationId: id }))
  }
</script>

<div class="location-sidebar">
  <div class="sidebar-header">
    <span class="sidebar-title">Locations</span>
    <button class="btn-add" on:click={handleAddLocation} title="New location">+</button>
  </div>

  <div class="location-list">
    {#if $locationsState.loading}
      <div class="empty-state">Loading...</div>
    {:else if $locationsState.locations.length === 0 && !isAddingLocation}
      <div class="empty-state">
        <p>No locations yet.</p>
        <p>Click + to add your first location.</p>
      </div>
    {:else}
      {#each $locationsState.locations as location (location.id)}
        <div
          class="location-item"
          class:active={$appState.activeLocationId === location.id}
          on:click={() => setActiveLocation(location.id)}
          on:contextmenu|preventDefault={(e) => handleContextMenu(e, location)}
        >
          <span class="location-icon">🗺️</span>
          <span class="location-name">{location.name}</span>
        </div>
      {/each}
    {/if}

    {#if isAddingLocation}
      <div class="location-input-row">
        <input
          type="text"
          placeholder="Location name..."
          bind:value={newLocationName}
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
        const location = contextMenu?.location
        contextMenu = null
        if (location) {
          if ($appState.activeLocationId === location.id) {
            appState.update(s => ({ ...s, activeLocationId: null }))
          }
          await deleteLocation(location.id)
        }
      }}
    >
      Delete "{contextMenu.location.name}"
    </button>
  </div>
{/if}

<style>
  .location-sidebar {
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

  .location-list {
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

  .location-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 8px 12px;
    cursor: pointer;
    transition: background 0.1s;
    border-left: 2px solid transparent;
    user-select: none;
  }

  .location-item:hover { background: var(--color-surface-hover); }

  .location-item.active {
    background: var(--color-accent-subtle);
    border-left-color: var(--color-accent);
  }

  .location-icon { font-size: 14px; flex-shrink: 0; }

  .location-name {
    flex: 1;
    font-family: var(--font-ui);
    font-size: 13px;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .location-input-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
  }

  .location-input-row input {
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