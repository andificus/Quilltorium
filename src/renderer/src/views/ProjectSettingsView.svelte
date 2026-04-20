<script lang="ts">
  import { appState, setProjectMetadata } from '../stores/app'

  $: metadata = $appState.projectMetadata

  let saving = false
  let saved = false

  // Local form state
  let title = ''
  let author = ''
  let targetWordCount: string | number = ''

  // Sync form state when metadata loads
  $: if (metadata) {
    title = metadata.title
    author = metadata.author
    targetWordCount = metadata.settings.targetWordCount?.toString() ?? ''
  }

  async function handleSave(): Promise<void> {
    if (!metadata) return
    saving = true

    const wordCountNum = targetWordCount === '' || targetWordCount === null || targetWordCount === undefined
        ? null
        : parseInt(String(targetWordCount))

    const updates = {
      title: title.trim() || metadata.title,
      author: author.trim(),
      settings: {
        ...metadata.settings,
        targetWordCount: isNaN(wordCountNum ?? NaN) ? null : wordCountNum
      }
    }

    const success = await window.api.updateProjectSettings(updates)
    if (success) {
      const updated = await window.api.getProjectMetadata()
      if (updated) {
        setProjectMetadata(updated)
        // Update the titlebar
        appState.update(s => ({ ...s, projectTitle: updated.title }))
      }
      saved = true
      setTimeout(() => { saved = false }, 2000)
    }

    saving = false
  }
</script>

{#if metadata}
  <div class="settings-view">
    <div class="settings-header">
      <h2 class="settings-title">Project Settings</h2>
      <p class="settings-subtitle">{metadata.title}</p>
    </div>

    <div class="settings-body">

      <div class="settings-card">
        <h3 class="card-title">Project Info</h3>

        <div class="field">
          <label for="proj-title">Novel Title</label>
          <input
            id="proj-title"
            type="text"
            bind:value={title}
          />
        </div>

        <div class="field">
          <label for="proj-author">Author Name</label>
          <input
            id="proj-author"
            type="text"
            placeholder="Your name"
            bind:value={author}
          />
        </div>
      </div>

      <div class="settings-card">
        <h3 class="card-title">Writing Goals</h3>

        <div class="field">
          <label for="word-goal">Target Word Count</label>
          <input
            id="word-goal"
            type="number"
            placeholder="e.g. 80000"
            bind:value={targetWordCount}
            min="0"
          />
          <p class="field-hint">Used for progress tracking in the Stats panel. Leave blank for no goal.</p>
        </div>
      </div>

      <div class="settings-card">
        <h3 class="card-title">Project Info</h3>
        <div class="info-grid">
          <span class="info-label">Created</span>
          <span class="info-value">{new Date(metadata.created).toLocaleDateString()}</span>
          <span class="info-label">Last Opened</span>
          <span class="info-value">{new Date(metadata.lastOpened).toLocaleDateString()}</span>
          <span class="info-label">Format Version</span>
          <span class="info-value">{metadata.formatVersion}</span>
          <span class="info-label">Project ID</span>
          <span class="info-value info-id">{metadata.id}</span>
        </div>
      </div>

      <div class="settings-actions">
        <button
          class="btn-save"
          on:click={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>

    </div>
  </div>
{:else}
  <div class="settings-empty">
    <p>No project open.</p>
  </div>
{/if}

<style>
  .settings-view {
    flex: 1;
    overflow-y: auto;
    background: var(--color-bg);
  }

  .settings-header {
    padding: var(--space-xl) var(--space-xl) var(--space-lg);
    border-bottom: 1px solid var(--color-border);
  }

  .settings-title {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 400;
    color: var(--color-text);
    margin: 0 0 4px;
  }

  .settings-subtitle {
    font-family: var(--font-ui);
    font-size: 13px;
    color: var(--color-text-muted);
    margin: 0;
  }

  .settings-body {
    padding: var(--space-lg) var(--space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    max-width: 500px;
  }

  .settings-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: var(--space-md) var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .card-title {
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
    margin: 0;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  label {
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  input {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 8px 10px;
    color: var(--color-text);
    font-family: var(--font-ui);
    font-size: 14px;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
  }

  input:focus { border-color: var(--color-accent); }

  .field-hint {
    font-family: var(--font-ui);
    font-size: 11px;
    color: var(--color-text-faint);
    margin: 0;
    line-height: 1.5;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 6px 12px;
    align-items: baseline;
  }

  .info-label {
    font-family: var(--font-ui);
    font-size: 11px;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .info-value {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-text);
  }

  .info-id {
    font-size: 10px;
    color: var(--color-text-faint);
    word-break: break-all;
  }

  .settings-actions {
    display: flex;
    justify-content: flex-end;
  }

  .btn-save {
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

  .btn-save:hover:not(:disabled) { opacity: 0.85; }
  .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

  .settings-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-faint);
    font-family: var(--font-ui);
    font-size: 13px;
  }
</style>