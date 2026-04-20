<script lang="ts">
  import { scenesState } from '../stores/scenes'
  import { charactersState } from '../stores/characters'
  import { locationsState } from '../stores/locations'
  import { appState, setActiveScene, setActiveSection } from '../stores/app'
  import type { SceneMetadata } from '../env'

  /** Group scenes by act */
  $: acts = (() => {
    const actMap = new Map<number, SceneMetadata[]>()
    for (const scene of $scenesState.scenes) {
      const act = scene.act ?? 1
      if (!actMap.has(act)) actMap.set(act, [])
      actMap.get(act)!.push(scene)
    }
    for (const [, scenes] of actMap) {
      scenes.sort((a, b) => a.order - b.order)
    }
    return [...actMap.entries()]
      .sort(([a], [b]) => a - b)
      .map(([actNum, scenes]) => ({ actNum, scenes }))
  })()

  const ACT_LABELS: Record<number, string> = {
    1: 'Act 1', 2: 'Act 2', 3: 'Act 3', 4: 'Act 4',
  }

  function actLabel(actNum: number): string {
    return ACT_LABELS[actNum] ?? `Act ${actNum}`
  }

  function statusColor(status: SceneMetadata['status']): string {
    if (status === 'final') return 'var(--color-final)'
    if (status === 'revise') return 'var(--color-revise)'
    return 'var(--color-draft)'
  }

  function getCharacterNames(slugs: string[]): string {
    return slugs
      .map(slug => $charactersState.characters.find(c => c.slug === slug)?.name ?? slug)
      .join(', ')
  }

  function getLocationName(slug: string | null): string {
    if (!slug) return ''
    return $locationsState.locations.find(l => l.slug === slug)?.name ?? slug
  }

  function getPovName(slug: string | null): string {
    if (!slug) return ''
    return $charactersState.characters.find(c => c.slug === slug)?.name ?? slug
  }

  function openScene(sceneId: string): void {
    setActiveSection('scenes')
    setActiveScene(sceneId)
  }

  async function moveToAct(sceneId: string, actNum: number): Promise<void> {
    await window.api.updateSceneMetadata(sceneId, { act: actNum })
    scenesState.update(s => ({
      ...s,
      scenes: s.scenes.map(sc =>
        sc.id === sceneId ? { ...sc, act: actNum } : sc
      )
    }))
  }

  // ── Mouse-based drag ──────────────────────────────────────────────────────

  let draggingScene: SceneMetadata | null = null
  let ghostEl: HTMLElement | null = null
  let highlightedAct: number | null = null
  let didMove = false

  function handleMouseDown(e: MouseEvent, scene: SceneMetadata): void {
    if (e.button !== 0) return
    e.preventDefault()

    draggingScene = scene
    didMove = false

    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    ghostEl = target.cloneNode(true) as HTMLElement
    ghostEl.style.cssText = `
      position: fixed;
      width: ${rect.width}px;
      left: ${rect.left}px;
      top: ${rect.top}px;
      opacity: 0.7;
      pointer-events: none;
      z-index: 9999;
      border: 2px solid var(--color-accent);
      border-radius: 6px;
      background: var(--color-surface);
      transition: none;
    `
    document.body.appendChild(ghostEl)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  function handleMouseMove(e: MouseEvent): void {
    if (!ghostEl || !draggingScene) return
    didMove = true

    ghostEl.style.left = `${e.clientX - 60}px`
    ghostEl.style.top = `${e.clientY - 20}px`

    const columns = document.querySelectorAll('[data-act]')
    let found: number | null = null
    for (const col of columns) {
      const rect = col.getBoundingClientRect()
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        found = parseInt((col as HTMLElement).dataset.act ?? '0')
        break
      }
    }
    highlightedAct = found
  }

  async function handleMouseUp(): Promise<void> {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)

    if (ghostEl) {
      ghostEl.remove()
      ghostEl = null
    }

    if (
      draggingScene &&
      highlightedAct !== null &&
      highlightedAct !== draggingScene.act &&
      didMove
    ) {
      await moveToAct(draggingScene.id, highlightedAct)
    }

    draggingScene = null
    highlightedAct = null
    didMove = false
  }
</script>

<div class="plot-board">
  <div class="board-header">
    <h2 class="board-title">Plot Board</h2>
    <p class="board-hint">Drag scenes between acts · Click a card to open the scene</p>
  </div>

  {#if $scenesState.scenes.length === 0}
    <div class="board-empty">
      <p>No scenes yet. Add scenes in the Scenes section to see them here.</p>
    </div>
  {:else}
    <div class="board-columns">
      {#each acts as { actNum, scenes }}
        <div
          class="act-column"
          class:drag-over={highlightedAct === actNum}
          data-act={actNum}
        >
          <div class="act-header">
            <span class="act-label">{actLabel(actNum)}</span>
            <span class="act-count">{scenes.length} scene{scenes.length !== 1 ? 's' : ''}</span>
          </div>

          <div class="act-cards">
            {#each scenes as scene (scene.id)}
              <div
                class="scene-card"
                class:active={$appState.activeSceneId === scene.id}
                on:mousedown={(e) => handleMouseDown(e, scene)}
                on:click={() => { if (!didMove) openScene(scene.id) }}
              >
                <div class="card-top">
                  <span
                    class="card-status"
                    style="background: {statusColor(scene.status)}"
                    title={scene.status}
                  ></span>
                  <span class="card-order">#{scene.order}</span>
                </div>

                <div class="card-title">{scene.title}</div>

                {#if scene.pov}
                  <div class="card-meta">
                    <span class="meta-icon">👤</span>
                    <span class="meta-text">{getPovName(scene.pov)}</span>
                  </div>
                {/if}

                {#if scene.location}
                  <div class="card-meta">
                    <span class="meta-icon">🗺️</span>
                    <span class="meta-text">{getLocationName(scene.location)}</span>
                  </div>
                {/if}

                {#if scene.characters.length > 0}
                  <div class="card-meta">
                    <span class="meta-icon">👥</span>
                    <span class="meta-text">{getCharacterNames(scene.characters)}</span>
                  </div>
                {/if}

                <div class="card-footer">
                  <span class="card-words">
                    {scene.wordCount > 0 ? `${scene.wordCount.toLocaleString()}w` : 'Empty'}
                  </span>
                  {#if scene.inWorldDate}
                    <span class="card-date">{scene.inWorldDate}</span>
                  {/if}
                </div>

                <div class="card-move">
                  {#each [1, 2, 3, 4] as targetAct}
                    {#if targetAct !== scene.act}
                      <button
                        class="move-btn"
                        on:click|stopPropagation={async () => {
                          await moveToAct(scene.id, targetAct)
                        }}
                      >
                        → Act {targetAct}
                      </button>
                    {/if}
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}

      {#if acts.length > 0}
        {@const nextAct = Math.max(...acts.map(a => a.actNum)) + 1}
        {#if nextAct <= 4}
          <div
            class="act-column act-column-empty"
            class:drag-over={highlightedAct === nextAct}
            data-act={nextAct}
          >
            <div class="act-header">
              <span class="act-label">{actLabel(nextAct)}</span>
              <span class="act-count">0 scenes</span>
            </div>
            <div class="act-empty-hint">Drag scenes here</div>
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .plot-board {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--color-bg);
  }

  .board-header {
    padding: var(--space-lg) var(--space-xl) var(--space-md);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .board-title {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 400;
    color: var(--color-text);
    margin: 0 0 4px;
  }

  .board-hint {
    font-family: var(--font-ui);
    font-size: 12px;
    color: var(--color-text-muted);
    margin: 0;
  }

  .board-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-faint);
    font-family: var(--font-ui);
    font-size: 13px;
  }

  .board-columns {
    flex: 1;
    display: flex;
    gap: var(--space-md);
    padding: var(--space-lg) var(--space-xl);
    overflow-x: auto;
    overflow-y: hidden;
    align-items: flex-start;
  }

  .act-column {
    width: 240px;
    flex-shrink: 0;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    max-height: 100%;
    transition: border-color 0.15s, background 0.15s;
  }

  .act-column.drag-over {
    border-color: var(--color-accent);
    background: var(--color-accent-subtle);
  }

  .act-column-empty {
    opacity: 0.5;
    border-style: dashed;
  }

  .act-column-empty.drag-over {
    opacity: 1;
  }

  .act-header {
    padding: var(--space-sm) var(--space-md);
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .act-label {
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .act-count {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-faint);
  }

  .act-cards {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-sm);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .act-empty-hint {
    padding: var(--space-lg) var(--space-md);
    text-align: center;
    font-family: var(--font-ui);
    font-size: 12px;
    color: var(--color-text-faint);
  }

  .scene-card {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: var(--space-sm) var(--space-md);
    cursor: grab;
    transition: border-color 0.15s, box-shadow 0.15s;
    display: flex;
    flex-direction: column;
    gap: 5px;
    user-select: none;
  }

  .scene-card:hover {
    border-color: var(--color-accent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .scene-card.active {
    border-color: var(--color-accent);
    background: var(--color-accent-subtle);
  }

  .card-top {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .card-status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .card-order {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-faint);
    margin-left: auto;
  }

  .card-title {
    font-family: var(--font-display);
    font-size: 14px;
    color: var(--color-text);
    line-height: 1.3;
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .meta-icon { font-size: 11px; flex-shrink: 0; }

  .meta-text {
    font-family: var(--font-ui);
    font-size: 11px;
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2px;
    padding-top: 4px;
    border-top: 1px solid var(--color-border);
  }

  .card-words {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-faint);
  }

  .card-date {
    font-family: var(--font-ui);
    font-size: 10px;
    color: var(--color-text-faint);
    font-style: italic;
  }

  .card-move {
    display: none;
    flex-wrap: wrap;
    gap: 3px;
    margin-top: 4px;
  }

  .scene-card:hover .card-move {
    display: flex;
  }

  .move-btn {
    padding: 2px 6px;
    background: var(--color-accent-subtle);
    border: 1px solid var(--color-accent);
    border-radius: 3px;
    color: var(--color-accent);
    font-family: var(--font-ui);
    font-size: 10px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .move-btn:hover {
    background: var(--color-accent);
    color: #1a1a1f;
  }
</style>