<script lang="ts">
  import { scenesState } from '../stores/scenes'
  import { appState, setActiveScene, setActiveSection } from '../stores/app'
  import type { SceneMetadata } from '../env'

  type ViewMode = 'manuscript' | 'chronological'
  let viewMode: ViewMode = 'manuscript'

  /** Scenes in manuscript order */
  $: manuscriptScenes = [...$scenesState.scenes]
    .sort((a, b) => a.order - b.order)

  /** Scenes in chronological order (alphabetical by inWorldDate) */
  $: chronologicalScenes = [...$scenesState.scenes]
    .filter(s => s.inWorldDate)
    .sort((a, b) => (a.inWorldDate ?? '').localeCompare(b.inWorldDate ?? ''))

  /** Scenes with no in-world date set */
  $: undatedScenes = $scenesState.scenes.filter(s => !s.inWorldDate)

  $: displayScenes = viewMode === 'manuscript' ? manuscriptScenes : chronologicalScenes

  function statusColor(status: SceneMetadata['status']): string {
    if (status === 'final') return 'var(--color-final)'
    if (status === 'revise') return 'var(--color-revise)'
    return 'var(--color-draft)'
  }

  function openScene(sceneId: string): void {
    setActiveSection('scenes')
    setActiveScene(sceneId)
  }

  /** Check if a scene is out of chronological order vs manuscript order */
  function isOutOfOrder(scene: SceneMetadata): boolean {
    if (!scene.inWorldDate || viewMode !== 'chronological') return false
    const chronoIndex = chronologicalScenes.findIndex(s => s.id === scene.id)
    const manuscriptIndex = manuscriptScenes.findIndex(s => s.id === scene.id)
    return Math.abs(chronoIndex - manuscriptIndex) > 0
  }
</script>

<div class="timeline-view">
  <div class="timeline-header">
    <div class="header-left">
      <h2 class="timeline-title">Timeline</h2>
      <p class="timeline-subtitle">{$appState.projectTitle}</p>
    </div>
    <div class="view-toggle">
      <button
        class="toggle-btn"
        class:active={viewMode === 'manuscript'}
        on:click={() => viewMode = 'manuscript'}
      >
        Manuscript Order
      </button>
      <button
        class="toggle-btn"
        class:active={viewMode === 'chronological'}
        on:click={() => viewMode = 'chronological'}
      >
        Chronological
      </button>
    </div>
  </div>

  {#if $scenesState.scenes.length === 0}
    <div class="timeline-empty">
      <p>No scenes yet. Add scenes in the Scenes section to see them here.</p>
    </div>
  {:else}
    <div class="timeline-body">

      {#if viewMode === 'chronological' && undatedScenes.length > 0}
        <div class="undated-notice">
          <span class="notice-icon">⚠️</span>
          <span>{undatedScenes.length} scene{undatedScenes.length !== 1 ? 's' : ''} without an in-world date — set dates in the Scene Info panel to include them here.</span>
        </div>
      {/if}

      <div class="timeline-track">
        {#each displayScenes as scene, index (scene.id)}
          <div class="timeline-entry">
            <!-- Connector line -->
            {#if index < displayScenes.length - 1}
              <div class="connector"></div>
            {/if}

            <!-- Node -->
            <div
              class="timeline-node"
              class:active={$appState.activeSceneId === scene.id}
              class:out-of-order={isOutOfOrder(scene)}
              on:click={() => openScene(scene.id)}
            >
              <div class="node-dot" style="background: {statusColor(scene.status)}"></div>

              <div class="node-content">
                <div class="node-header">
                  <span class="node-order">
                    {viewMode === 'manuscript' ? `#${scene.order}` : `→ #${scene.order}`}
                  </span>
                  {#if scene.inWorldDate}
                    <span class="node-date">{scene.inWorldDate}</span>
                  {:else}
                    <span class="node-date undated">No date set</span>
                  {/if}
                  {#if isOutOfOrder(scene)}
                    <span class="out-of-order-badge" title="This scene's chronological position differs from its manuscript position">⚡ Out of order</span>
                  {/if}
                </div>

                <div class="node-title">{scene.title}</div>

                <div class="node-meta">
                  <span
                    class="meta-status"
                    style="color: {statusColor(scene.status)}"
                  >
                    {scene.status}
                  </span>
                  {#if scene.wordCount > 0}
                    <span class="meta-words">{scene.wordCount.toLocaleString()}w</span>
                  {/if}
                  <span class="meta-act">Act {scene.act}</span>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>

    </div>
  {/if}
</div>

<style>
  .timeline-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--color-bg);
  }

  .timeline-header {
    padding: var(--space-lg) var(--space-xl) var(--space-md);
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .timeline-title {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 400;
    color: var(--color-text);
    margin: 0;
  }

  .timeline-subtitle {
    font-family: var(--font-ui);
    font-size: 13px;
    color: var(--color-text-muted);
    margin: 0;
  }

  .view-toggle {
    display: flex;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 3px;
    gap: 2px;
  }

  .toggle-btn {
    padding: 6px 14px;
    background: none;
    border: none;
    border-radius: 4px;
    font-family: var(--font-ui);
    font-size: 12px;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.15s;
  }

  .toggle-btn.active {
    background: var(--color-accent);
    color: #1a1a1f;
    font-weight: 600;
  }

  .toggle-btn:hover:not(.active) {
    color: var(--color-text);
    background: var(--color-surface-hover);
  }

  .timeline-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-faint);
    font-family: var(--font-ui);
    font-size: 13px;
  }

  .timeline-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-lg) var(--space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .undated-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-family: var(--font-ui);
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .notice-icon { font-size: 14px; }

  .timeline-track {
    display: flex;
    flex-direction: column;
    max-width: 700px;
  }

  .timeline-entry {
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .connector {
    width: 2px;
    height: 16px;
    background: var(--color-border);
    margin-left: 11px;
  }

  .timeline-node {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .timeline-node:hover {
    border-color: var(--color-accent);
  }

  .timeline-node.active {
    border-color: var(--color-accent);
    background: var(--color-accent-subtle);
  }

  .timeline-node.out-of-order {
    border-color: var(--color-revise);
  }

  .node-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 4px;
  }

  .node-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .node-header {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .node-order {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-faint);
    flex-shrink: 0;
  }

  .node-date {
    font-family: var(--font-ui);
    font-size: 12px;
    color: var(--color-accent);
    font-style: italic;
  }

  .node-date.undated {
    color: var(--color-text-faint);
  }

  .out-of-order-badge {
    font-family: var(--font-ui);
    font-size: 10px;
    color: var(--color-revise);
    background: rgba(107, 143, 202, 0.1);
    border: 1px solid var(--color-revise);
    border-radius: 3px;
    padding: 1px 5px;
  }

  .node-title {
    font-family: var(--font-display);
    font-size: 16px;
    color: var(--color-text);
    line-height: 1.3;
  }

  .node-meta {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .meta-status {
    font-family: var(--font-ui);
    font-size: 11px;
    text-transform: capitalize;
  }

  .meta-words {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-faint);
  }

  .meta-act {
    font-family: var(--font-ui);
    font-size: 11px;
    color: var(--color-text-faint);
  }
</style>