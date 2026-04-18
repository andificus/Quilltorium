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