import { writable } from 'svelte/store'
import type { NoteMetadata } from '../env'

interface NotesState {
  notes: NoteMetadata[]
  loading: boolean
}

const initialState: NotesState = {
  notes: [],
  loading: false
}

export const notesState = writable<NotesState>(initialState)

export async function loadNotes(): Promise<void> {
  notesState.update(s => ({ ...s, loading: true }))
  try {
    const notes = await window.api.listNotes()
    notesState.update(s => ({ ...s, notes, loading: false }))
  } catch (error) {
    console.error('Failed to load notes:', error)
    notesState.update(s => ({ ...s, loading: false }))
  }
}

export async function createNote(): Promise<NoteMetadata | null> {
  try {
    const note = await window.api.createNote()
    if (note) {
      notesState.update(s => ({ ...s, notes: [note, ...s.notes] }))
      return note
    }
    return null
  } catch (error) {
    console.error('Failed to create note:', error)
    return null
  }
}

export function removeNoteFromStore(id: string): void {
  notesState.update(s => ({ ...s, notes: s.notes.filter(n => n.id !== id) }))
}

export function updateNotePreview(id: string, preview: string): void {
  notesState.update(s => ({
    ...s,
    notes: s.notes.map(n => n.id === id ? { ...n, preview } : n)
  }))
}

export function resetNotes(): void {
  notesState.set(initialState)
}