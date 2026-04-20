import { writable } from 'svelte/store'
import type { ProjectMetadata } from '../env'

export type AppSection = 'scenes' | 'characters' | 'locations' | 'lore' | 'notes' | 'plot' | 'timeline' | 'stats' | 'settings'

interface AppState {
  activeSection: AppSection
  projectPath: string | null
  projectTitle: string | null
  activeSceneId: string | null
  activeCharacterId: string | null
  activeLocationId: string | null
  activeLoreId: string | null
  projectMetadata: ProjectMetadata | null
}

const initialState: AppState = {
  activeSection: 'scenes',
  projectPath: null,
  projectTitle: null,
  activeSceneId: null,
  activeCharacterId: null,
  activeLocationId: null,
  activeLoreId: null,
  projectMetadata: null
}

export const appState = writable<AppState>(initialState)

export function setActiveSection(section: AppSection): void {
  appState.update(state => ({ ...state, activeSection: section }))
}

export function setProject(id: string, title: string): void {
  appState.update(state => ({ ...state, projectPath: id, projectTitle: title }))
}

export function setProjectMetadata(metadata: ProjectMetadata): void {
  appState.update(state => ({ ...state, projectMetadata: metadata }))
}

export function setActiveScene(id: string): void {
  appState.update(state => ({ ...state, activeSceneId: id || null }))
}

export function closeProject(): void {
  appState.update(state => ({
    ...state,
    projectPath: null,
    projectTitle: null,
    activeSceneId: null,
    activeCharacterId: null,
    activeLocationId: null,
    activeLoreId: null,
    projectMetadata: null
  }))
}