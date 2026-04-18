<script lang="ts">
  // Placeholder handlers — wired up properly in Issue #19
  function handleNewProject(): void {
    console.log('New project — coming in Issue #19')
  }

  function handleOpenProject(): void {
    console.log('Open project — coming in Issue #19')
  }
</script>

<div class="welcome">
  <div class="welcome-content">
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
</div>

<style>
  .welcome {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg);
  }

  .welcome-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    max-width: 400px;
    text-align: center;
    padding: 48px;
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
    margin-top: 16px;
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

  .btn-primary:hover {
    opacity: 0.85;
  }

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

  .btn-secondary:hover {
    background: var(--color-surface-hover);
  }

  .welcome-hint {
    margin-top: 24px;
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

  .welcome-hint p:last-child {
    margin: 0;
  }
</style>