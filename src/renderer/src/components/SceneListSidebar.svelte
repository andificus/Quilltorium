<script lang="ts">
  import { onMount } from 'svelte'
  import { scenesState, loadScenes, createScene, reorderScenes } from '../stores/scenes'
  import { setActiveScene, appState } from '../stores/app'
  import type { SceneMetadata } from '../env'

  onMount(() => {
    loadScenes()
  })

  let isAddingScene = false
  let newSceneTitle = ''

  function handleAddScene(): void {
    isAddingScene = true
    newSceneTitle = ''
  }

  async function handleConfirmAdd(): Promise<void> {
    if (newSceneTitle.trim() === '') {
      isAddingScene = false
      return
    }
    const scene = await createScene(newSceneTitle.trim())
    if (scene) setActiveScene(scene.id)
    isAddingScene = false
    newSceneTitle = ''
  }

  function handleCancelAdd(): void {
    isAddingScene = false
    newSceneTitle = ''
  }

  function handleAddKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') handleConfirmAdd()
    if (e.key === 'Escape') handleCancelAdd()
  }

  // Drag and drop
  let draggedId: string | null = null
  let dragOverId: string | null = null

  function handleDragStart(e: DragEvent, scene: SceneMetadata): void {
    draggedId = scene.id
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: DragEvent, scene: SceneMetadata): void {
    e.preventDefault()
    dragOverId = scene.id
  }

  function handleDrop(e: DragEvent, targetScene: SceneMetadata): void {
    e.preventDefault()
    if (!draggedId || draggedId === targetScene.id) return

    const scenes = [...$scenesState.scenes]
    const fromIndex = scenes.findIndex(s => s.id === draggedId)
    const toIndex = scenes.findIndex(s => s.id === targetScene.id)
    const [moved] = scenes.splice(fromIndex, 1)
    scenes.splice(toIndex, 0, moved)

    reorderScenes(scenes)
    draggedId = null
    dragOverId = null
  }

  function handleDragEnd(): void {
    draggedId = null
    dragOverId = null
  }

  function statusColor(status: SceneMetadata['status']): string {
    if (status === 'final') return 'var(--color-final)'
    if (status === 'revise') return 'var(--color-revise)'
    return 'var(--color-draft)'
  }

  function formatWordCount(count: number): string {
    if (count === 0) return ''
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
    return `${count}`
  }
</script>

<div class="scene-sidebar">
  <div class="sidebar-header">
    <span class="sidebar-title">Scenes</span>
    <button class="btn-add" on:click={handleAddScene} title="New scene">+</button>
  </div>

  <div class="scene-list">
    {#if $scenesState.loading}
      <div class="empty-state">Loading...</div>
    {:else if $scenesState.scenes.length === 0 && !isAddingScene}
      <div class="empty-state">
        <p>No scenes yet.</p>
        <p>Click + to add your first scene.</p>
      </div>
    {:else}
      {#each $scenesState.scenes as scene (scene.id)}
        <div
          class="scene-item"
          class:active={$appState.activeSceneId === scene.id}
          class:drag-over={dragOverId === scene.id}
          draggable="true"
          on:click={() => setActiveScene(scene.id)}
          on:dragstart={(e) => handleDragStart(e, scene)}
          on:dragover={(e) => handleDragOver(e, scene)}
          on:drop={(e) => handleDrop(e, scene)}
          on:dragend={handleDragEnd}
        >
          <span class="drag-handle">⠿</span>
          <span
            class="status-dot"
            style="background: {statusColor(scene.status)}"
          ></span>
          <span class="scene-title">{scene.title}</span>
          {#if scene.wordCount > 0}
            <span class="word-count">{formatWordCount(scene.wordCount)}</span>
          {/if}
        </div>
      {/each}
    {/if}

    {#if isAddingScene}
      <div class="scene-input-row">
        <input
          type="text"
          placeholder="Scene title..."
          bind:value={newSceneTitle}
          on:keydown={handleAddKeydown}
          autofocus
        />
        <button class="btn-confirm" on:click={handleConfirmAdd}>✓</button>
        <button class="btn-cancel" on:click={handleCancelAdd}>✕</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .scene-sidebar {
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

  .scene-list {
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

  .scene-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 8px 12px;
    cursor: pointer;
    transition: background 0.1s;
    border-left: 2px solid transparent;
    user-select: none;
  }

  .scene-item:hover { background: var(--color-surface-hover); }

  .scene-item.active {
    background: var(--color-accent-subtle);
    border-left-color: var(--color-accent);
  }

  .scene-item.drag-over {
    background: var(--color-accent-subtle);
    border-top: 1px solid var(--color-accent);
  }

  .drag-handle {
    color: var(--color-text-faint);
    font-size: 14px;
    cursor: grab;
    flex-shrink: 0;
  }

  .drag-handle:active { cursor: grabbing; }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .scene-title {
    flex: 1;
    font-family: var(--font-ui);
    font-size: 13px;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .word-count {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-faint);
    flex-shrink: 0;
  }

  .scene-input-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
  }

  .scene-input-row input {
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
</style>