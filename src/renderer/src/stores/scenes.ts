import { writable } from 'svelte/store'
import type { SceneMetadata } from '../env'

interface ScenesState {
  scenes: SceneMetadata[]
  loading: boolean
}

const initialState: ScenesState = {
  scenes: [],
  loading: false
}

export const scenesState = writable<ScenesState>(initialState)

/** Load all scenes for the current project from disk */
export async function loadScenes(): Promise<void> {
  scenesState.update(s => ({ ...s, loading: true }))
  try {
    const scenes = await window.api.listScenes()
    scenesState.update(s => ({ ...s, scenes, loading: false }))
  } catch (error) {
    console.error('Failed to load scenes:', error)
    scenesState.update(s => ({ ...s, loading: false }))
  }
}

/** Create a new scene and add it to the list */
export async function createScene(title: string): Promise<SceneMetadata | null> {
  try {
    const scene = await window.api.createScene(title)
    if (scene) {
      scenesState.update(s => ({
        ...s,
        scenes: [...s.scenes, scene].sort((a, b) => a.order - b.order)
      }))
      return scene
    }
    return null
  } catch (error) {
    console.error('Failed to create scene:', error)
    return null
  }
}

/** Update scene order after drag and drop */
export async function reorderScenes(scenes: SceneMetadata[]): Promise<void> {
  const reordered = scenes.map((scene, index) => ({ ...scene, order: index + 1 }))
  scenesState.update(s => ({ ...s, scenes: reordered }))
  try {
    await window.api.reorderScenes(reordered.map(s => ({ id: s.id, order: s.order })))
  } catch (error) {
    console.error('Failed to reorder scenes:', error)
  }
}

export async function deleteScene(id: string): Promise<void> {
  try {
    await window.api.deleteScene(id)
    scenesState.update(s => ({
      ...s,
      scenes: s.scenes.filter(scene => scene.id !== id)
    }))
  } catch (error) {
    console.error('Failed to delete scene:', error)
  }
}

/** Reset scenes state when project closes */
export function resetScenes(): void {
  scenesState.set(initialState)
}