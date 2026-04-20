<script lang="ts">
  import { onMount } from 'svelte'
  import { setProject } from '../stores/app'
  import { loadScenes } from '../stores/scenes'
  import { loadCharacters } from '../stores/characters'
  import { loadLocations } from '../stores/locations'
  import NewProjectModal from '../components/NewProjectModal.svelte'

  let showNewProjectModal = false
  let recentProjects: Array<{ path: string; title: string; lastOpened: string }> = []

  onMount(async () => {
    recentProjects = await window.api.getRecentProjects()
  })

  async function openProject(metadata: Awaited<ReturnType<typeof window.api.openProject>>): Promise<void> {
    if (metadata) {
      setProject(metadata.id, metadata.title)
      await Promise.all([loadScenes(), loadCharacters(), loadLocations()])
      recentProjects = await window.api.getRecentProjects()
    }
  }

  function handleNewProject(): void {
    showNewProjectModal = true
  }

  async function handleModalConfirm(
    e: CustomEvent<{ title: string; author: string }>
  ): Promise<void> {
    showNewProjectModal = false
    const { title, author } = e.detail
    const metadata = await window.api.createProject(title, author)
    await openProject(metadata)
  }

  function handleModalCancel(): void {
    showNewProjectModal = false
  }

  async function handleOpenProject(): Promise<void> {
    const metadata = await window.api.openProject()
    await openProject(metadata)
  }

  async function handleOpenRecent(path: string): Promise<void> {
    const metadata = await window.api.openRecentProject(path)
    if (metadata) {
      await openProject(metadata)
    } else {
      // Project not found — refresh the list
      recentProjects = await window.api.getRecentProjects()
    }
  }

  function formatDate(iso: string): string {
    const date = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }
</script>

{#if showNewProjectModal}
  <NewProjectModal
    on:confirm={handleModalConfirm}
    on:cancel={handleModalCancel}
  />
{/if}

<div class="welcome">
  <div class="welcome-left">
    <h1 class="welcome-title">Quilltorium</h1>
    <p class="welcome-subtitle">Your novel. Your files. Your way.</p>

    <div class="welcome-actions">
      <button class="btn-primary" on:click={handleNewProject}>
        New Project
      </button>
      <button class="btn-secondary" on:click={handleOpenProject}>
        Open Project
      </button>
    </div>

    <div class="welcome-hint">
      <p>All your writing is stored as plain Markdown files in a folder you choose.</p>
      <p>No accounts. No cloud. No lock-in.</p>
    </div>
  </div>

  {#if recentProjects.length > 0}
    <div class="welcome-right">
      <h2 class="recent-title">Recent Projects</h2>
      <div class="recent-list">
        {#each recentProjects as project}
          <button
            class="recent-item"
            on:click={() => handleOpenRecent(project.path)}
          >
            <span class="recent-icon">📖</span>
            <div class="recent-info">
              <span class="recent-name">{project.title}</span>
              <span class="recent-path">{project.path}</span>
              <span class="recent-date">{formatDate(project.lastOpened)}</span>
            </div>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .welcome {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 80px;
    background: var(--color-bg);
    padding: var(--space-xl);
  }

  .welcome-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    max-width: 320px;
  }

  .welcome-title {
    font-family: var(--font-display);
    font-size: 48px;
    font-weight: 400;
    color: var(--color-text);
    margin: 0;
    letter-spacing: -0.02em;
  }

  .welcome-subtitle {
    font-family: var(--font-ui);
    font-size: 14px;
    color: var(--color-text-muted);
    margin: 0;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .welcome-actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  .btn-primary {
    padding: 10px 24px;
    background: var(--color-accent);
    color: #1a1a1f;
    border: none;
    border-radius: 6px;
    font-family: var(--font-ui);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .btn-primary:hover { opacity: 0.85; }

  .btn-secondary {
    padding: 10px 24px;
    background: transparent;
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-family: var(--font-ui);
    font-size: 14px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-secondary:hover { background: var(--color-surface-hover); }

  .welcome-hint {
    padding: 16px;
    background: var(--color-surface);
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }

  .welcome-hint p {
    font-family: var(--font-ui);
    font-size: 12px;
    color: var(--color-text-muted);
    margin: 0 0 4px;
    line-height: 1.5;
  }

  .welcome-hint p:last-child { margin: 0; }

  .welcome-right {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 300px;
  }

  .recent-title {
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
    margin: 0;
  }

  .recent-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .recent-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.15s;
    width: 100%;
  }

  .recent-item:hover { border-color: var(--color-accent); }

  .recent-icon { font-size: 18px; flex-shrink: 0; }

  .recent-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .recent-name {
    font-family: var(--font-display);
    font-size: 15px;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .recent-path {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-text-faint);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .recent-date {
    font-family: var(--font-ui);
    font-size: 11px;
    color: var(--color-text-muted);
  }
</style>