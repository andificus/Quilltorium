<script lang="ts">
  import { appState, setActiveSection, type AppSection } from '../stores/app'

  interface NavItem {
    section: AppSection
    label: string
    icon: string
  }

  const navItems: NavItem[] = [
    { section: 'scenes',     label: 'Scenes',     icon: '📄' },
    { section: 'characters', label: 'Characters',  icon: '👤' },
    { section: 'locations',  label: 'Locations',   icon: '🗺️' },
    { section: 'lore',       label: 'Lore',        icon: '📚' },
    { section: 'notes',      label: 'Notes',       icon: '✏️' },
    { section: 'plot',       label: 'Plot',        icon: '🎬' },
    { section: 'timeline',   label: 'Timeline',    icon: '🕐' },
    { section: 'stats',      label: 'Stats',       icon: '📊' },
  ]
</script>

<nav class="nav-rail">
  <div class="nav-brand">
    <span class="brand-icon">✒</span>
  </div>

  <div class="nav-items">
    {#each navItems as item}
      <button
        class="nav-item"
        class:active={$appState.activeSection === item.section}
        disabled={$appState.projectPath === null}
        on:click={() => setActiveSection(item.section)}
        title={item.label}
      >
        <span class="nav-icon">{item.icon}</span>
        <span class="nav-label">{item.label}</span>
      </button>
    {/each}
  </div>

  <div class="nav-footer">
    <button
      class="nav-item"
      class:active={$appState.activeSection === 'settings'}
      disabled={$appState.projectPath === null}
      on:click={() => setActiveSection('settings')}
      title="Settings"
    >
      <span class="nav-icon">⚙</span>
      <span class="nav-label">Settings</span>
    </button>
  </div>
</nav>

<style>
  .nav-rail {
    width: 80px;
    height: 100%;
    background: var(--color-nav);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0;
    flex-shrink: 0;
  }

  .nav-brand {
    width: 100%;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 8px;
  }

  .brand-icon {
    font-size: 20px;
    color: var(--color-accent);
  }

  .nav-items {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 100%;
    padding: 4px 6px;
  }

  .nav-footer {
    width: 100%;
    padding: 6px;
    border-top: 1px solid var(--color-border);
  }

  .nav-item {
    width: 100%;
    height: 56px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    background: none;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    color: var(--color-text-muted);
    transition: background 0.15s, color 0.15s;
    padding: 0;
  }

  .nav-item:hover:not(:disabled) {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }

  .nav-item.active {
    background: var(--color-accent-subtle);
    color: var(--color-accent);
  }

  .nav-item:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .nav-icon {
    font-size: 18px;
    line-height: 1;
  }

  .nav-label {
    font-size: 9px;
    font-family: var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    line-height: 1;
  }
</style>