import { writable } from 'svelte/store'
import type { LocationMetadata } from '../env'

interface LocationsState {
  locations: LocationMetadata[]
  loading: boolean
}

const initialState: LocationsState = {
  locations: [],
  loading: false
}

export const locationsState = writable<LocationsState>(initialState)

export async function loadLocations(): Promise<void> {
  locationsState.update(s => ({ ...s, loading: true }))
  try {
    const locations = await window.api.listLocations()
    locationsState.update(s => ({ ...s, locations, loading: false }))
  } catch (error) {
    console.error('Failed to load locations:', error)
    locationsState.update(s => ({ ...s, loading: false }))
  }
}

export async function createLocation(name: string): Promise<LocationMetadata | null> {
  try {
    const location = await window.api.createLocation(name)
    if (location) {
      locationsState.update(s => ({
        ...s,
        locations: [...s.locations, location].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      }))
      return location
    }
    return null
  } catch (error) {
    console.error('Failed to create location:', error)
    return null
  }
}

export async function deleteLocation(id: string): Promise<void> {
  try {
    await window.api.deleteLocation(id)
    locationsState.update(s => ({
      ...s,
      locations: s.locations.filter(l => l.id !== id)
    }))
  } catch (error) {
    console.error('Failed to delete location:', error)
  }
}

export function resetLocations(): void {
  locationsState.set(initialState)
}