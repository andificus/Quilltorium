/**
 * Shared TypeScript interfaces for all Quilltorium data models.
 * This is the single source of truth for all data shapes in the app.
 * 
 * Every interface here corresponds to a .json sidecar file in the project folder.
 */

/** The three possible states a scene can be in */
export type SceneStatus = 'draft' | 'revise' | 'final'

/** The two UI modes available to the writer */
export type UIMode = 'beginner' | 'advanced'

/**
 * Metadata for a single scene.
 * Stored as {slug}.json alongside {slug}.md in the /scenes/ folder.
 */
export interface SceneMetadata {
  /** UUID v4 — generated with crypto.randomUUID() */
  id: string
  /** Display title of the scene */
  title: string
  /** Manuscript order position (1-based) */
  order: number
  /** Act number this scene belongs to (1, 2, 3...) */
  act: number
  /** Chapter number within the act, if applicable */
  chapter: number | null
  /** Current draft status */
  status: SceneStatus
  /** Slug of the POV character, or null if not set */
  pov: string | null
  /** Slugs of all characters appearing in this scene */
  characters: string[]
  /** Slug of the location this scene is set in, or null */
  location: string | null
  /** Free text in-world date, e.g. "Year 1, Day 12" */
  inWorldDate: string | null
  /** Arbitrary tags for filtering and search */
  tags: string[]
  /** Word count — updated automatically on every save */
  wordCount: number
  /** ISO 8601 timestamp */
  createdAt: string
  /** ISO 8601 timestamp */
  updatedAt: string
}

/**
 * Metadata for a character.
 * Stored as {slug}.json alongside {slug}.md in the /characters/ folder.
 */
export interface CharacterMetadata {
  /** UUID v4 */
  id: string
  /** URL-safe identifier derived from name — used in file names and cross-references */
  slug: string
  /** Full display name */
  name: string
  /** Alternative names or titles */
  aliases: string[]
  /** Arbitrary tags */
  tags: string[]
  /** ID of the scene where this character first appears, or null */
  firstAppearance: string | null
  /** ISO 8601 timestamp */
  createdAt: string
  /** ISO 8601 timestamp */
  updatedAt: string
}

/**
 * Metadata for a location.
 * Stored as {slug}.json alongside {slug}.md in the /locations/ folder.
 */
export interface LocationMetadata {
  /** UUID v4 */
  id: string
  /** URL-safe identifier derived from name */
  slug: string
  /** Display name */
  name: string
  /** Arbitrary tags */
  tags: string[]
  /** Relative path to a map or reference image in /assets/, or null */
  mapImage: string | null
  /** ISO 8601 timestamp */
  createdAt: string
  /** ISO 8601 timestamp */
  updatedAt: string
}

/**
 * Root project metadata.
 * Stored as project.json in the root of the novel project folder.
 */
export interface ProjectMetadata {
  /** UUID v4 */
  id: string
  /** Novel title */
  title: string
  /** Author name */
  author: string
  /** Format version string for future migration handling, e.g. "1.0" */
  formatVersion: string
  /** ISO 8601 timestamp */
  created: string
  /** ISO 8601 timestamp — updated every time the project is opened */
  lastOpened: string
  /** User-configurable project settings */
  settings: {
    /** Optional word count goal for progress tracking */
    targetWordCount: number | null
    /** Default status assigned to new scenes */
    defaultStatus: SceneStatus
    /** Current UI mode */
    uiMode: UIMode
  }
}