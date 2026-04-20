import { writable } from 'svelte/store'
import type { LoreMetadata } from '../env'

interface LoreState {
  pages: LoreMetadata[]
  loading: boolean
}

const initialState: LoreState = {
  pages: [],
  loading: false
}

export const loreState = writable<LoreState>(initialState)

export async function loadLore(): Promise<void> {
  loreState.update(s => ({ ...s, loading: true }))
  try {
    const pages = await window.api.listLore()
    loreState.update(s => ({ ...s, pages, loading: false }))
  } catch (error) {
    console.error('Failed to load lore:', error)
    loreState.update(s => ({ ...s, loading: false }))
  }
}

export async function createLorePage(title: string): Promise<LoreMetadata | null> {
  try {
    const page = await window.api.createLore(title)
    if (page) {
      loreState.update(s => ({
        ...s,
        pages: [...s.pages, page].sort((a, b) => a.title.localeCompare(b.title))
      }))
      return page
    }
    return null
  } catch (error) {
    console.error('Failed to create lore page:', error)
    return null
  }
}

export async function deleteLorePage(id: string): Promise<void> {
  try {
    await window.api.deleteLore(id)
    loreState.update(s => ({
      ...s,
      pages: s.pages.filter(p => p.id !== id)
    }))
  } catch (error) {
    console.error('Failed to delete lore page:', error)
  }
}

export function resetLore(): void {
  loreState.set(initialState)
}