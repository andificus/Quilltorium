import { writable } from 'svelte/store'

/** The sections available in the navigation rail */
export type AppSection = 'scenes' | 'characters' | 'locations' | 'lore' | 'notes' | 'stats'

/** Global application state */
interface AppState {
  /** Currently active section in the nav rail */
  activeSection: AppSection
  /** Path to the currently open project folder, or null if none open */
  projectPath: string | null
  /** Display title of the currently open project */
  projectTitle: string | null
}

const initialState: AppState = {
  activeSection: 'scenes',
  projectPath: null,
  projectTitle: null
}

export const appState = writable<AppState>(initialState)

/** Switch the active section */
export function setActiveSection(section: AppSection): void {
  appState.update(state => ({ ...state, activeSection: section }))
}

/** Set the open project */
export function setProject(path: string, title: string): void {
  appState.update(state => ({ ...state, projectPath: path, projectTitle: title }))
}

/** Close the current project */
export function closeProject(): void {
  appState.update(state => ({ ...state, projectPath: null, projectTitle: null }))
}