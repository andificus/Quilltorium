import { writable } from 'svelte/store'
import type { CharacterMetadata } from '../env'

interface CharactersState {
  characters: CharacterMetadata[]
  loading: boolean
}

const initialState: CharactersState = {
  characters: [],
  loading: false
}

export const charactersState = writable<CharactersState>(initialState)

/** Load all characters for the current project from disk */
export async function loadCharacters(): Promise<void> {
  charactersState.update(s => ({ ...s, loading: true }))
  try {
    const characters = await window.api.listCharacters()
    charactersState.update(s => ({ ...s, characters, loading: false }))
  } catch (error) {
    console.error('Failed to load characters:', error)
    charactersState.update(s => ({ ...s, loading: false }))
  }
}

/** Create a new character and add it to the store */
export async function createCharacter(name: string): Promise<CharacterMetadata | null> {
  try {
    const character = await window.api.createCharacter(name)
    if (character) {
      charactersState.update(s => ({
        ...s,
        characters: [...s.characters, character].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      }))
      return character
    }
    return null
  } catch (error) {
    console.error('Failed to create character:', error)
    return null
  }
}

/** Delete a character from disk and remove from store */
export async function deleteCharacter(id: string): Promise<void> {
  try {
    await window.api.deleteCharacter(id)
    charactersState.update(s => ({
      ...s,
      characters: s.characters.filter(c => c.id !== id)
    }))
  } catch (error) {
    console.error('Failed to delete character:', error)
  }
}

/** Reset characters state when project closes */
export function resetCharacters(): void {
  charactersState.set(initialState)
}