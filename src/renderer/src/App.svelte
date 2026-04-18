<script lang="ts">
  import NavRail from './components/NavRail.svelte'
  import WelcomeView from './views/WelcomeView.svelte'
  import { appState } from './stores/app'
</script>

<div class="app-shell">
  <!-- Title bar -->
  <div class="title-bar">
    <span class="title-bar-app">Quilltorium</span>
    {#if $appState.projectTitle}
      <span class="title-bar-sep">—</span>
      <span class="title-bar-project">{$appState.projectTitle}</span>
    {/if}
  </div>

  <!-- Main layout -->
  <div class="app-body">
    <NavRail />

    {#if $appState.projectPath === null}
      <!-- No project open — show welcome screen -->
      <WelcomeView />
    {:else}
      <!-- Project open — show section content -->
      <div class="app-content">
        <div class="content-placeholder">
          Section content coming soon — Issue #20 onwards
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .app-shell {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--color-bg);
  }

  .title-bar {
    height: var(--titlebar-height);
    background: var(--color-nav);
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    padding: 0 var(--space-md);
    gap: var(--space-sm);
    flex-shrink: 0;
    -webkit-app-region: drag;
    user-select: none;
  }

  .title-bar-app {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    color: var(--color-accent);
    letter-spacing: 0.01em;
  }

  .title-bar-sep {
    color: var(--color-text-faint);
    font-size: 14px;
  }

  .title-bar-project {
    font-family: var(--font-ui);
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .app-body {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .app-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .content-placeholder {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-faint);
    font-family: var(--font-ui);
    font-size: 13px;
  }
</style>