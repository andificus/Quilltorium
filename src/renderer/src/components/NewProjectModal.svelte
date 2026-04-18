<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher<{
    confirm: { title: string; author: string }
    cancel: void
  }>()

  let title = ''
  let author = ''

  function handleConfirm(): void {
    if (title.trim() === '') return
    dispatch('confirm', { title: title.trim(), author: author.trim() })
  }

  function handleCancel(): void {
    dispatch('cancel')
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') handleConfirm()
    if (e.key === 'Escape') handleCancel()
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-backdrop" on:click={handleCancel}>
  <div class="modal" on:click|stopPropagation>
    <h2 class="modal-title">New Project</h2>

    <div class="field">
      <label for="project-title">Novel Title</label>
      <input
        id="project-title"
        type="text"
        placeholder="e.g. The Sundering of Eltharien"
        bind:value={title}
        autofocus
      />
    </div>

    <div class="field">
      <label for="project-author">Author Name</label>
      <input
        id="project-author"
        type="text"
        placeholder="e.g. Andy Wentzloff"
        bind:value={author}
      />
    </div>

    <div class="modal-actions">
      <button class="btn-secondary" on:click={handleCancel}>Cancel</button>
      <button
        class="btn-primary"
        on:click={handleConfirm}
        disabled={title.trim() === ''}
      >
        Create Project
      </button>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 28px;
    width: 420px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .modal-title {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 400;
    color: var(--color-text);
    margin: 0;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  label {
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  input {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 10px 12px;
    color: var(--color-text);
    font-family: var(--font-ui);
    font-size: 14px;
    outline: none;
    transition: border-color 0.15s;
  }

  input:focus {
    border-color: var(--color-accent);
  }

  input::placeholder {
    color: var(--color-text-faint);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 4px;
  }

  .btn-primary {
    padding: 9px 20px;
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

  .btn-primary:hover:not(:disabled) {
    opacity: 0.85;
  }

  .btn-primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-secondary {
    padding: 9px 20px;
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
</style>