<script lang="ts">
  import SceneMetadataPanel from './components/SceneMetadataPanel.svelte'
  import SceneEditor from './components/SceneEditor.svelte'
  import NavRail from './components/NavRail.svelte'
  import SceneListSidebar from './components/SceneListSidebar.svelte'
  import WelcomeView from './views/WelcomeView.svelte'
  import { appState, closeProject } from './stores/app'
  import { resetScenes } from './stores/scenes'
  import StatsView from './views/StatsView.svelte'
  import CharacterListSidebar from './components/CharacterListSidebar.svelte'
  import CharacterEditor from './components/CharacterEditor.svelte'
  import { resetCharacters } from './stores/characters'

  function handleCloseProject(): void {
    resetScenes()
    resetCharacters()
    closeProject()
  }

  async function handleExport(): Promise<void> {
    await window.api.exportManuscript()
  }
</script>

<div class="app-shell">
  <!-- Title bar -->
  <div class="title-bar">
    <span class="title-bar-app">Quilltorium</span>
    {#if $appState.projectTitle}
      <span class="title-bar-sep">&mdash;</span>
      <span class="title-bar-project">{$appState.projectTitle}</span>
      <div class="title-bar-actions">
        <button
          class="btn-export"
          on:click={handleExport}
          title="Export manuscript to .docx"
        >
          Export
        </button>
        <button class="btn-close-project" on:click={handleCloseProject} title="Close project">
          ✕
        </button>
      </div>
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
        {:else if $appState.activeSection === 'characters'}
          <CharacterListSidebar />
        {/if}

        <div class="main-editor">
          {#if $appState.activeSection === 'stats'}
            <StatsView />
          {:else if $appState.activeSection === 'characters'}
            {#if $appState.activeCharacterId}
              {#key $appState.activeCharacterId}
                <CharacterEditor characterId={$appState.activeCharacterId} />
              {/key}
            {:else}
              <div class="editor-placeholder">Select a character to view their sheet</div>
            {/if}
          {:else if $appState.activeSceneId}
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

  .title-bar-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  -webkit-app-region: no-drag;
}

.btn-export {
  padding: 4px 12px;
  background: var(--color-accent-subtle);
  border: 1px solid var(--color-accent);
  border-radius: 4px;
  color: var(--color-accent);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-export:hover {
  background: var(--color-accent);
  color: #1a1a1f;
}

.btn-close-project:hover {
  color: var(--color-text);
}
</style>