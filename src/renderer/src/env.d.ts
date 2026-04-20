/// <reference types="svelte" />
/// <reference types="vite/client" />

import type { ProjectMetadata, SceneMetadata, CharacterMetadata, LocationMetadata, LoreMetadata, NoteMetadata } from '../../src-shared/types'

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
      exportManuscript(options: {
        includeStatuses: string[]
        includeTitles: boolean
      }): Promise<boolean>
      listCharacters(): Promise<CharacterMetadata[]>
      createCharacter(name: string): Promise<CharacterMetadata | null>
      readCharacter(characterId: string): Promise<string>
      saveCharacter(characterId: string, content: string): Promise<boolean>
      deleteCharacter(characterId: string): Promise<boolean>
      updateCharacterMetadata(
        characterId: string,
        updates: Partial<CharacterMetadata>
      ): Promise<boolean>
      listLocations(): Promise<LocationMetadata[]>
      createLocation(name: string): Promise<LocationMetadata | null>
      readLocation(locationId: string): Promise<string>
      saveLocation(locationId: string, content: string): Promise<boolean>
      deleteLocation(locationId: string): Promise<boolean>
      updateLocationMetadata(
        locationId: string,
        updates: Partial<LocationMetadata>
      ): Promise<boolean>
      getRecentProjects(): Promise<Array<{ path: string; title: string; lastOpened: string }>>
      openRecentProject(projectPath: string): Promise<ProjectMetadata | null>
      getProjectMetadata(): Promise<ProjectMetadata | null>
      updateProjectSettings(updates: Partial<ProjectMetadata>): Promise<boolean>
      listLore(): Promise<LoreMetadata[]>
      createLore(title: string): Promise<LoreMetadata | null>
      readLore(loreId: string): Promise<string>
      saveLore(loreId: string, content: string): Promise<boolean>
      deleteLore(loreId: string): Promise<boolean>
      updateLoreMetadata(loreId: string, updates: Partial<LoreMetadata>): Promise<boolean>
      getLoreBacklinks(targetSlug: string): Promise<LoreMetadata[]>
      listNotes(): Promise<NoteMetadata[]>
      createNote(): Promise<NoteMetadata | null>
      readNote(noteId: string): Promise<string>
      saveNote(noteId: string, content: string): Promise<boolean>
      deleteNote(noteId: string): Promise<boolean>
      promoteToScene(noteId: string, title: string): Promise<SceneMetadata | null>
      promoteToCharacter(noteId: string, name: string): Promise<CharacterMetadata | null>
      promoteToLocation(noteId: string, name: string): Promise<LocationMetadata | null>
      promoteToLore(noteId: string, title: string): Promise<LoreMetadata | null>
    }
  }
}

export type { ProjectMetadata, SceneMetadata, CharacterMetadata, LocationMetadata, LoreMetadata, NoteMetadata }