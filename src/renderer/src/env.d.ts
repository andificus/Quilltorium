/// <reference types="svelte" />
/// <reference types="vite/client" />

import type { ProjectMetadata, SceneMetadata } from '../../src-shared/types'

declare global {
  interface Window {
    api: {
      openProject(): Promise<ProjectMetadata | null>
      createProject(title: string, author: string): Promise<ProjectMetadata | null>
      listScenes(): Promise<SceneMetadata[]>
      createScene(title: string): Promise<SceneMetadata | null>
      reorderScenes(updates: Array<{ id: string; order: number }>): Promise<void>
      readScene(sceneId: string): Promise<string>
      saveScene(sceneId: string, content: string): Promise<number>
      deleteScene(sceneId: string): Promise<boolean>
    }
  }
}

export type { ProjectMetadata, SceneMetadata }