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
  import CharacterMetadataPanel from './components/CharacterMetadataPanel.svelte'
  import LocationListSidebar from './components/LocationListSidebar.svelte'
  import LocationEditor from './components/LocationEditor.svelte'
  import { resetLocations } from './stores/locations'
  import LocationMetadataPanel from './components/LocationMetadataPanel.svelte'
  import PlotBoardView from './views/PlotBoardView.svelte'
  import ProjectSettingsView from './views/ProjectSettingsView.svelte'
  import ExportModal from './components/ExportModal.svelte'
  import TimelineView from './views/TimelineView.svelte'
  import LoreListSidebar from './components/LoreListSidebar.svelte'
  import LoreEditor from './components/LoreEditor.svelte'
  import LoreMetadataPanel from './components/LoreMetadataPanel.svelte'
  import { resetLore } from './stores/lore'
  import NotesView from './views/NotesView.svelte'
  import { resetNotes } from './stores/notes'

  function handleCloseProject(): void {
    resetScenes()
    resetCharacters()
    resetLocations()
    resetLore()
    resetNotes()
    closeProject()
  }

  let showExportModal = false

  function handleExport(): void {
    showExportModal = true
  }

  async function handleExportConfirm(
    e: CustomEvent<{ includeStatuses: string[]; includeTitles: boolean }>
  ): Promise<void> {
    showExportModal = false
    await window.api.exportManuscript(e.detail)
  }

  function handleExportCancel(): void {
    showExportModal = false
  }
</script>

{#if showExportModal}
  <ExportModal
    on:confirm={handleExportConfirm}
    on:cancel={handleExportCancel}
  />
{/if}
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
        {:else if $appState.activeSection === 'locations'}
          <LocationListSidebar />
        {:else if $appState.activeSection === 'lore'}
          <LoreListSidebar />  
        {/if}

        <div class="main-editor">
          {#if $appState.activeSection === 'stats'}
            <StatsView />
          {:else if $appState.activeSection === 'plot'}
            <PlotBoardView />
          {:else if $appState.activeSection === 'timeline'}
            <TimelineView />
          {:else if $appState.activeSection === 'settings'}
            <ProjectSettingsView />
          {:else if $appState.activeSection === 'notes'}
            <NotesView />
          {:else if $appState.activeSection === 'characters'}
            {#if $appState.activeCharacterId}
              {#key $appState.activeCharacterId}
                <CharacterEditor characterId={$appState.activeCharacterId} />
              {/key}
              <CharacterMetadataPanel characterId={$appState.activeCharacterId} />
            {:else}
              <div class="editor-placeholder">Select a character to view their sheet</div>
            {/if}
          {:else if $appState.activeSection === 'locations'}
            {#if $appState.activeLocationId}
              {#key $appState.activeLocationId}
                <LocationEditor locationId={$appState.activeLocationId} />
              {/key}
              <LocationMetadataPanel locationId={$appState.activeLocationId} />
            {:else}
              <div class="editor-placeholder">Select a location to view its page</div>
            {/if}
          {:else if $appState.activeSection === 'lore'}
            {#if $appState.activeLoreId}
              {#key $appState.activeLoreId}
                <LoreEditor loreId={$appState.activeLoreId} />
              {/key}
              <LoreMetadataPanel loreId={$appState.activeLoreId} />
            {:else}
              <div class="editor-placeholder">Select a lore page to start writing</div>
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