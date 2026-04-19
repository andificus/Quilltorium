import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { ProjectMetadata, SceneMetadata } from '../../src-shared/types'

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
    ipcRenderer.invoke('scenes:update-metadata', sceneId, updates)
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