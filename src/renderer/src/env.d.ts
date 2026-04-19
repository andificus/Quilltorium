/// <reference types="svelte" />
/// <reference types="vite/client" />

import type { ProjectMetadata, SceneMetadata, CharacterMetadata } from '../../src-shared/types'

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
      updateSceneMetadata(
        sceneId: string,
        updates: Partial<SceneMetadata>
      ): Promise<boolean>
      exportManuscript(): Promise<boolean>
      listCharacters(): Promise<CharacterMetadata[]>
      createCharacter(name: string): Promise<CharacterMetadata | null>
      readCharacter(characterId: string): Promise<string>
      saveCharacter(characterId: string, content: string): Promise<boolean>
      deleteCharacter(characterId: string): Promise<boolean>
      updateCharacterMetadata(
        characterId: string,
        updates: Partial<CharacterMetadata>
      ): Promise<boolean>
    }
  }
}

export type { ProjectMetadata, SceneMetadata, CharacterMetadata }