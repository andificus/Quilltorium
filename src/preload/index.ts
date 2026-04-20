import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { ProjectMetadata, SceneMetadata, CharacterMetadata, LocationMetadata } from '../../src-shared/types'

const api = {
  openProject: (): Promise<ProjectMetadata | null> =>
    ipcRenderer.invoke('project:open'),

  createProject: (title: string, author: string): Promise<ProjectMetadata | null> =>
    ipcRenderer.invoke('project:create', title, author),

  listScenes: (): Promise<SceneMetadata[]> =>
    ipcRenderer.invoke('scenes:list'),

  createScene: (title: string): Promise<SceneMetadata | null> =>
    ipcRenderer.invoke('scenes:create', title),

  reorderScenes: (updates: Array<{ id: string; order: number }>): Promise<void> =>
    ipcRenderer.invoke('scenes:reorder', updates),

  readScene: (sceneId: string): Promise<string> =>
    ipcRenderer.invoke('scenes:read', sceneId),

  saveScene: (sceneId: string, content: string): Promise<number> =>
    ipcRenderer.invoke('scenes:save', sceneId, content),

  deleteScene: (sceneId: string): Promise<boolean> =>
    ipcRenderer.invoke('scenes:delete', sceneId),

  updateSceneMetadata: (
    sceneId: string,
    updates: Partial<import('../../src-shared/types').SceneMetadata>
  ): Promise<boolean> =>
    ipcRenderer.invoke('scenes:update-metadata', sceneId, updates),

  exportManuscript: (): Promise<boolean> =>
    ipcRenderer.invoke('manuscript:export'),

  listCharacters: (): Promise<CharacterMetadata[]> =>
  ipcRenderer.invoke('characters:list'),

  createCharacter: (name: string): Promise<CharacterMetadata | null> =>
    ipcRenderer.invoke('characters:create', name),

  readCharacter: (characterId: string): Promise<string> =>
    ipcRenderer.invoke('characters:read', characterId),

  saveCharacter: (characterId: string, content: string): Promise<boolean> =>
    ipcRenderer.invoke('characters:save', characterId, content),

  deleteCharacter: (characterId: string): Promise<boolean> =>
    ipcRenderer.invoke('characters:delete', characterId),

  updateCharacterMetadata: (
    characterId: string,
    updates: Partial<CharacterMetadata>
  ): Promise<boolean> =>
    ipcRenderer.invoke('characters:update-metadata', characterId, updates),

  listLocations: (): Promise<LocationMetadata[]> =>
    ipcRenderer.invoke('locations:list'),

  createLocation: (name: string): Promise<LocationMetadata | null> =>
    ipcRenderer.invoke('locations:create', name),

  readLocation: (locationId: string): Promise<string> =>
    ipcRenderer.invoke('locations:read', locationId),

  saveLocation: (locationId: string, content: string): Promise<boolean> =>
    ipcRenderer.invoke('locations:save', locationId, content),

  deleteLocation: (locationId: string): Promise<boolean> =>
    ipcRenderer.invoke('locations:delete', locationId),

  updateLocationMetadata: (
    locationId: string,
    updates: Partial<LocationMetadata>
  ): Promise<boolean> =>
    ipcRenderer.invoke('locations:update-metadata', locationId, updates),
    
  getRecentProjects: (): Promise<Array<{ path: string; title: string; lastOpened: string }>> =>
    ipcRenderer.invoke('app:get-recent-projects'),

  openRecentProject: (projectPath: string): Promise<ProjectMetadata | null> =>
    ipcRenderer.invoke('app:open-recent-project', projectPath),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}

export type API = typeof api