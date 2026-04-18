/// <reference types="svelte" />
/// <reference types="vite/client" />

import type { ProjectMetadata } from '../../src-shared/types'

declare global {
  interface Window {
    api: {
      openProject(): Promise<ProjectMetadata | null>
      createProject(title: string, author: string): Promise<ProjectMetadata | null>
    }
  }
}

export type { ProjectMetadata }