<script lang="ts">
  import SceneMetadataPanel from './components/SceneMetadataPanel.svelte'
  import SceneEditor from './components/SceneEditor.svelte'
  import NavRail from './components/NavRail.svelte'
  import SceneListSidebar from './components/SceneListSidebar.svelte'
  import WelcomeView from './views/WelcomeView.svelte'
  import { appState, closeProject } from './stores/app'
  import { resetScenes } from './stores/scenes'

  function handleCloseProject(): void {
    resetScenes()
    closeProject()
  }
</script>

<div class="app-shell">
  <!-- Title bar -->
  <div class="title-bar">
    <span class="title-bar-app">Quilltorium</span>
    {#if $appState.projectTitle}
      <span class="title-bar-sep">&mdash;</span>
      <span class="title-bar-project">{$appState.projectTitle}</span>
      <button class="btn-close-project" on:click={handleCloseProject} title="Close project">
      ✕
    </button>
    {/if}
  </div>

  <!-- Main layout -->
  <div class="app-body">
    <NavRail />

    {#if $appState.projectPath === null}
      <WelcomeView />
    {:else}
      <div class="app-content">
        {#if $appState.activeSection === 'scenes'}
          <SceneListSidebar />
        {/if}
        <div class="main-editor">
          {#if $appState.activeSceneId}
            {#key $appState.activeSceneId}
              <SceneEditor sceneId={$appState.activeSceneId} />
            {/key}
            <SceneMetadataPanel sceneId={$appState.activeSceneId} />
          {:else}
            <div class="editor-placeholder">Select a scene to start writing</div>
          {/if}
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

  .main-editor {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .editor-placeholder {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-faint);
    font-family: var(--font-ui);
    font-size: 13px;
  }

  .btn-close-project {
    margin-left: auto;
    background: none;
    border: none;
    color: var(--color-text-faint);
    font-size: 11px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    -webkit-app-region: no-drag;
    transition: color 0.15s;
  }

.btn-close-project:hover {
  color: var(--color-text);
}
</style>