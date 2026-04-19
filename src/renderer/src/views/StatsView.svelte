<script lang="ts">
  import { scenesState } from '../stores/scenes'
  import { appState } from '../stores/app'

  /** Total words across all scenes */
  $: totalWords = $scenesState.scenes.reduce((sum, s) => sum + s.wordCount, 0)

  /** Count scenes by status */
  $: draftCount = $scenesState.scenes.filter(s => s.status === 'draft').length
  $: reviseCount = $scenesState.scenes.filter(s => s.status === 'revise').length
  $: finalCount = $scenesState.scenes.filter(s => s.status === 'final').length
  $: totalScenes = $scenesState.scenes.length

  /** Words in final scenes only */
  $: finalWords = $scenesState.scenes
    .filter(s => s.status === 'final')
    .reduce((sum, s) => sum + s.wordCount, 0)

  /** Target word count from project settings — hardcoded default for now */
  const TARGET_WORD_COUNT = 80000

  /** Progress percentage toward target */
  $: progressPercent = Math.min((totalWords / TARGET_WORD_COUNT) * 100, 100)
  $: finalProgressPercent = Math.min((finalWords / TARGET_WORD_COUNT) * 100, 100)

  /** Format large numbers with commas */
  function fmt(n: number): string {
    return n.toLocaleString()
  }

  /** Scenes sorted by word count descending */
  $: scenesByWords = [...$scenesState.scenes]
    .filter(s => s.wordCount > 0)
    .sort((a, b) => b.wordCount - a.wordCount)
</script>

<div class="stats-view">
  <div class="stats-header">
    <h2 class="stats-title">Writing Statistics</h2>
    <p class="stats-project">{$appState.projectTitle}</p>
  </div>

  <div class="stats-body">

    <!-- Total progress -->
    <div class="stat-card">
      <div class="stat-card-header">
        <span class="stat-card-label">Total Progress</span>
        <span class="stat-card-value">{fmt(totalWords)} words</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: {progressPercent}%"></div>
      </div>
      <div class="progress-meta">
        <span>{progressPercent.toFixed(1)}% of {fmt(TARGET_WORD_COUNT)} word goal</span>
        <span>{fmt(TARGET_WORD_COUNT - totalWords)} words remaining</span>
      </div>
    </div>

    <!-- Final words progress -->
    <div class="stat-card">
      <div class="stat-card-header">
        <span class="stat-card-label">Final Draft Progress</span>
        <span class="stat-card-value">{fmt(finalWords)} words</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill final" style="width: {finalProgressPercent}%"></div>
      </div>
      <div class="progress-meta">
        <span>{finalProgressPercent.toFixed(1)}% of goal in final scenes</span>
      </div>
    </div>

    <!-- Scene status breakdown -->
    <div class="stat-card">
      <div class="stat-card-header">
        <span class="stat-card-label">Scene Status</span>
        <span class="stat-card-value">{totalScenes} total</span>
      </div>
      <div class="status-breakdown">
        <div class="status-row">
          <span class="status-dot draft"></span>
          <span class="status-name">Draft</span>
          <span class="status-count">{draftCount}</span>
          <div class="status-bar">
            <div
              class="status-bar-fill draft"
              style="width: {totalScenes > 0 ? (draftCount / totalScenes) * 100 : 0}%"
            ></div>
          </div>
        </div>
        <div class="status-row">
          <span class="status-dot revise"></span>
          <span class="status-name">Revise</span>
          <span class="status-count">{reviseCount}</span>
          <div class="status-bar">
            <div
              class="status-bar-fill revise"
              style="width: {totalScenes > 0 ? (reviseCount / totalScenes) * 100 : 0}%"
            ></div>
          </div>
        </div>
        <div class="status-row">
          <span class="status-dot final"></span>
          <span class="status-name">Final</span>
          <span class="status-count">{finalCount}</span>
          <div class="status-bar">
            <div
              class="status-bar-fill final"
              style="width: {totalScenes > 0 ? (finalCount / totalScenes) * 100 : 0}%"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Word count by scene -->
    {#if scenesByWords.length > 0}
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">Words by Scene</span>
        </div>
        <div class="scene-breakdown">
          {#each scenesByWords as scene}
            <div class="scene-row">
              <span
                class="scene-status-dot"
                style="background: var(--color-{scene.status})"
              ></span>
              <span class="scene-name">{scene.title}</span>
              <span class="scene-words">{fmt(scene.wordCount)}</span>
              <div class="scene-bar">
                <div
                  class="scene-bar-fill"
                  style="width: {scenesByWords[0].wordCount > 0
                    ? (scene.wordCount / scenesByWords[0].wordCount) * 100
                    : 0}%"
                ></div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

  </div>
</div>

<style>
  .stats-view {
    flex: 1;
    overflow-y: auto;
    background: var(--color-bg);
  }

  .stats-header {
    padding: var(--space-xl) var(--space-xl) var(--space-lg);
    border-bottom: 1px solid var(--color-border);
  }

  .stats-title {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 400;
    color: var(--color-text);
    margin: 0 0 4px;
  }

  .stats-project {
    font-family: var(--font-ui);
    font-size: 13px;
    color: var(--color-text-muted);
    margin: 0;
  }

  .stats-body {
    padding: var(--space-lg) var(--space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    max-width: 700px;
  }

  .stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: var(--space-md) var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .stat-card-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .stat-card-label {
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .stat-card-value {
    font-family: var(--font-mono);
    font-size: 20px;
    color: var(--color-text);
  }

  .progress-bar {
    height: 6px;
    background: var(--color-border);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--color-accent);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .progress-fill.final {
    background: var(--color-final);
  }

  .progress-meta {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-ui);
    font-size: 11px;
    color: var(--color-text-muted);
  }

  .status-breakdown {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    margin-top: 4px;
  }

  .status-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-dot.draft  { background: var(--color-draft); }
  .status-dot.revise { background: var(--color-revise); }
  .status-dot.final  { background: var(--color-final); }

  .status-name {
    font-family: var(--font-ui);
    font-size: 13px;
    color: var(--color-text);
    width: 48px;
    text-transform: capitalize;
  }

  .status-count {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--color-text-muted);
    width: 24px;
    text-align: right;
  }

  .status-bar {
    flex: 1;
    height: 4px;
    background: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
  }

  .status-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .status-bar-fill.draft  { background: var(--color-draft); }
  .status-bar-fill.revise { background: var(--color-revise); }
  .status-bar-fill.final  { background: var(--color-final); }

  .scene-breakdown {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 4px;
  }

  .scene-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .scene-status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .scene-name {
    font-family: var(--font-ui);
    font-size: 13px;
    color: var(--color-text);
    width: 160px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 0;
  }

  .scene-words {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-text-muted);
    width: 48px;
    text-align: right;
    flex-shrink: 0;
  }

  .scene-bar {
    flex: 1;
    height: 4px;
    background: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
  }

  .scene-bar-fill {
    height: 100%;
    background: var(--color-accent);
    border-radius: 2px;
    transition: width 0.3s ease;
  }
</style>