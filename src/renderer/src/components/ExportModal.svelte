<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { scenesState } from '../stores/scenes'

  const dispatch = createEventDispatcher<{
    confirm: { includeStatuses: string[]; includeTitles: boolean }
    cancel: void
  }>()

  let includeDraft = false
  let includeRevise = true
  let includeFinal = true
  let includeTitles = true

  $: sceneCount = $scenesState.scenes.filter(s => {
    if (s.status === 'draft' && !includeDraft) return false
    if (s.status === 'revise' && !includeRevise) return false
    if (s.status === 'final' && !includeFinal) return false
    return true
  }).length

  function handleConfirm(): void {
    const includeStatuses: string[] = []
    if (includeDraft) includeStatuses.push('draft')
    if (includeRevise) includeStatuses.push('revise')
    if (includeFinal) includeStatuses.push('final')
    dispatch('confirm', { includeStatuses, includeTitles })
  }

  function handleCancel(): void {
    dispatch('cancel')
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') handleCancel()
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-backdrop" on:click={handleCancel}>
  <div class="modal" on:click|stopPropagation>
    <h2 class="modal-title">Export Manuscript</h2>

    <div class="section">
      <label class="section-label">Include Scenes</label>
      <div class="checkbox-group">
        <label class="checkbox-row">
          <input type="checkbox" bind:checked={includeFinal} />
          <span class="status-dot final"></span>
          <span>Final</span>
        </label>
        <label class="checkbox-row">
          <input type="checkbox" bind:checked={includeRevise} />
          <span class="status-dot revise"></span>
          <span>Revise</span>
        </label>
        <label class="checkbox-row">
          <input type="checkbox" bind:checked={includeDraft} />
          <span class="status-dot draft"></span>
          <span>Draft</span>
        </label>
      </div>
    </div>

    <div class="section">
      <label class="section-label">Formatting</label>
      <div class="checkbox-group">
        <label class="checkbox-row">
          <input type="checkbox" bind:checked={includeTitles} />
          <span>Include scene titles as headings</span>
        </label>
      </div>
    </div>

    <div class="export-summary">
      <span class="summary-icon">📄</span>
      <span class="summary-text">
        {sceneCount} scene{sceneCount !== 1 ? 's' : ''} will be exported
      </span>
    </div>

    <div class="modal-actions">
      <button class="btn-secondary" on:click={handleCancel}>Cancel</button>
      <button
        class="btn-primary"
        on:click={handleConfirm}
        disabled={sceneCount === 0}
      >
        Export to .docx
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
    width: 380px;
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

  .section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-label {
    font-family: var(--font-ui);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 10px 12px;
  }

  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-ui);
    font-size: 13px;
    color: var(--color-text);
    cursor: pointer;
  }

  .checkbox-row input[type="checkbox"] {
    accent-color: var(--color-accent);
    cursor: pointer;
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

  .export-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: var(--color-accent-subtle);
    border: 1px solid var(--color-accent);
    border-radius: 6px;
  }

  .summary-icon { font-size: 16px; }

  .summary-text {
    font-family: var(--font-ui);
    font-size: 13px;
    color: var(--color-accent);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
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

  .btn-primary:hover:not(:disabled) { opacity: 0.85; }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

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

  .btn-secondary:hover { background: var(--color-surface-hover); }
</style>