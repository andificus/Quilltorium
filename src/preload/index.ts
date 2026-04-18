import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { ProjectMetadata } from '../../src-shared/types'

/**
 * The API exposed to the renderer process via contextBridge.
 * All communication with the main process goes through these methods.
 */
const api = {
  /**
   * Open an existing project by selecting a folder.
   * Returns the project metadata if successful, or null if cancelled.
   */
  openProject: (): Promise<ProjectMetadata | null> =>
    ipcRenderer.invoke('project:open'),

  /**
   * Create a new project in a selected folder.
   * Returns the project metadata if successful, or null if cancelled.
   */
  createProject: (title: string, author: string): Promise<ProjectMetadata | null> =>
    ipcRenderer.invoke('project:create', title, author),
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