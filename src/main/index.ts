import { app, shell, BrowserWindow, dialog, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'
import { ElectronAdapter } from '../../src-shared/storage/ElectronAdapter'
import type { ProjectMetadata, SceneMetadata, CharacterMetadata, LocationMetadata } from '../../src-shared/types'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'


/** The main application window instance */
let mainWindow: BrowserWindow | null = null

/**
 * Creates the main application window.
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.setTitle('Quilltorium')
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/**
 * Configures the auto-updater with a fully user-prompted flow.
 * Nothing downloads or installs without explicit user confirmation.
 */
function setupUpdater(): void {
  // CRITICAL: never change these to true
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false

  // A newer version is available — ask the user before downloading anything
  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `Quilltorium ${info.version} is available.`,
      detail: 'Would you like to download it now? You can keep writing while it downloads.',
      buttons: ['Download Now', 'Not Right Now'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate()
      }
    })
  })

  // Show download progress in the taskbar
  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.setProgressBar(progress.percent / 100)
  })

  // Download finished — ask the user when to install
  autoUpdater.on('update-downloaded', () => {
    mainWindow?.setProgressBar(-1)
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'The update has been downloaded.',
      detail: 'Restart Quilltorium now to install it, or it will install automatically next time you open the app.',
      buttons: ['Restart Now', 'Install Later'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  })

  // No update found — do nothing, open normally
  autoUpdater.on('update-not-available', () => {
    // Intentionally silent
  })

  // Log update errors but don't crash the app
  autoUpdater.on('error', (error) => {
    console.error('Update check failed:', error)
  })
}

app.whenReady().then(() => {
  // Set app user model ID to match electron-builder appId
  electronApp.setAppUserModelId('com.andificus.quilltorium')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  // Check for updates after the window is ready (only in production)
  if (!is.dev) {
    setupUpdater()
    autoUpdater.checkForUpdates()
  }
})

// ── IPC Handlers ────────────────────────────────────────────────────────────

const adapter = new ElectronAdapter()

/** The filesystem path of the currently open project */
let currentProjectPath: string | null = null

/** Convert a title to a URL-safe slug */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() || 'untitled'
}

/**
 * Opens a folder picker and loads an existing project.
 * Returns the project metadata or null if cancelled.
 */
ipcMain.handle('project:open', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Open Novel Project',
    properties: ['openDirectory']
  })

  if (result.canceled || result.filePaths.length === 0) return null

  const projectPath = result.filePaths[0]
  const projectJsonPath = join(projectPath, 'project.json')

  try {
    const exists = await adapter.exists(projectJsonPath)
    if (!exists) {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Not a Quilltorium Project',
        message: 'The selected folder does not contain a Quilltorium project.',
        detail: 'Please select a folder that was created by Quilltorium.'
      })
      return null
    }

    const raw = await adapter.readFile(projectJsonPath)
    const metadata: ProjectMetadata = JSON.parse(raw)
    metadata.lastOpened = new Date().toISOString()
    await adapter.writeFile(projectJsonPath, JSON.stringify(metadata, null, 2))
    currentProjectPath = projectPath
    return metadata
  } catch (error) {
    console.error('Failed to open project:', error)
    return null
  }
})

/**
 * Opens a folder picker, then creates a new project structure.
 * Returns the project metadata or null if cancelled.
 */
ipcMain.handle('project:create', async (_event, title: string, author: string) => {
  const result = await dialog.showOpenDialog({
    title: 'Choose Project Location',
    properties: ['openDirectory']
  })

  if (result.canceled || result.filePaths.length === 0) return null

  const projectPath = join(result.filePaths[0], title.replace(/[^a-zA-Z0-9 _-]/g, '').trim())

  try {
    // Create folder structure
    await adapter.createDirectory(projectPath)
    await adapter.createDirectory(join(projectPath, 'scenes'))
    await adapter.createDirectory(join(projectPath, 'characters'))
    await adapter.createDirectory(join(projectPath, 'locations'))
    await adapter.createDirectory(join(projectPath, 'lore'))
    await adapter.createDirectory(join(projectPath, 'notes'))
    await adapter.createDirectory(join(projectPath, 'assets'))

    // Write project.json
    const now = new Date().toISOString()
    const metadata: ProjectMetadata = {
      id: crypto.randomUUID(),
      title,
      author,
      formatVersion: '1.0',
      created: now,
      lastOpened: now,
      settings: {
        targetWordCount: null,
        defaultStatus: 'draft',
        uiMode: 'advanced'
      }
    }

    await adapter.writeFile(
      join(projectPath, 'project.json'),
      JSON.stringify(metadata, null, 2)
    )

    currentProjectPath = projectPath
    return metadata
  } catch (error) {
    console.error('Failed to create project:', error)
    return null
  }
})

/** List all scenes for the current project, sorted by order */
ipcMain.handle('scenes:list', async (): Promise<SceneMetadata[]> => {
  if (!currentProjectPath) return []

  try {
    const scenesDir = join(currentProjectPath, 'scenes')
    const files = await adapter.listFiles(scenesDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    const scenes: SceneMetadata[] = []
    for (const file of jsonFiles) {
      try {
        const raw = await adapter.readFile(file)
        scenes.push(JSON.parse(raw) as SceneMetadata)
      } catch {
        // Skip malformed files
      }
    }

    return scenes.sort((a, b) => a.order - b.order)
  } catch (error) {
    console.error('Failed to list scenes:', error)
    return []
  }
})

/** Create a new scene with the given title */
ipcMain.handle('scenes:create', async (_event, title: string): Promise<SceneMetadata | null> => {
  if (!currentProjectPath) return null

  try {
    const scenesDir = join(currentProjectPath, 'scenes')
    const existingFiles = await adapter.listFiles(scenesDir)
    const existingCount = existingFiles.filter(f => f.endsWith('.json')).length

    const baseSlug = slugify(title)
    let slug = baseSlug
    let counter = 1

    // Handle slug collisions
    while (await adapter.exists(join(scenesDir, `${slug}.json`))) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const now = new Date().toISOString()
    const metadata: SceneMetadata = {
      id: crypto.randomUUID(),
      title,
      order: existingCount + 1,
      act: 1,
      chapter: null,
      status: 'draft',
      pov: null,
      characters: [],
      location: null,
      inWorldDate: null,
      tags: [],
      wordCount: 0,
      createdAt: now,
      updatedAt: now
    }

    await adapter.writeFile(join(scenesDir, `${slug}.md`), '')
    await adapter.writeFile(
      join(scenesDir, `${slug}.json`),
      JSON.stringify(metadata, null, 2)
    )

    return metadata
  } catch (error) {
    console.error('Failed to create scene:', error)
    return null
  }
})

/** Update the order field of multiple scenes */
ipcMain.handle('scenes:reorder', async (
  _event,
  updates: Array<{ id: string; order: number }>
): Promise<void> => {
  if (!currentProjectPath) return

  try {
    const scenesDir = join(currentProjectPath, 'scenes')
    const files = await adapter.listFiles(scenesDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    for (const update of updates) {
      for (const file of jsonFiles) {
        try {
          const raw = await adapter.readFile(file)
          const metadata = JSON.parse(raw) as SceneMetadata
          if (metadata.id === update.id) {
            metadata.order = update.order
            metadata.updatedAt = new Date().toISOString()
            await adapter.writeFile(file, JSON.stringify(metadata, null, 2))
            break
          }
        } catch {
          // Skip malformed files
        }
      }
    }
  } catch (error) {
    console.error('Failed to reorder scenes:', error)
  }
})

/** Read the Markdown content of a scene */
ipcMain.handle('scenes:read', async (_event, sceneId: string): Promise<string> => {
  if (!currentProjectPath) return ''

  try {
    const scenesDir = join(currentProjectPath, 'scenes')
    const files = await adapter.listFiles(scenesDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    for (const file of jsonFiles) {
      try {
        const raw = await adapter.readFile(file)
        const metadata = JSON.parse(raw) as SceneMetadata
        if (metadata.id === sceneId) {
          const mdPath = file.replace('.json', '.md')
          return await adapter.readFile(mdPath)
        }
      } catch {
        // Skip malformed files
      }
    }
    return ''
  } catch (error) {
    console.error('Failed to read scene:', error)
    return ''
  }
})

/** Save the Markdown content of a scene and update its word count */
ipcMain.handle('scenes:save', async (
  _event,
  sceneId: string,
  content: string
): Promise<number> => {
  if (!currentProjectPath) return 0

  try {
    const scenesDir = join(currentProjectPath, 'scenes')
    const files = await adapter.listFiles(scenesDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    for (const file of jsonFiles) {
      try {
        const raw = await adapter.readFile(file)
        const metadata = JSON.parse(raw) as SceneMetadata
        if (metadata.id === sceneId) {
          // Save markdown content
          const mdPath = file.replace('.json', '.md')
          await adapter.writeFile(mdPath, content)

          // Update word count and timestamp
          const wordCount = content.trim() === ''
            ? 0
            : content.trim().split(/\s+/).length
          metadata.wordCount = wordCount
          metadata.updatedAt = new Date().toISOString()
          await adapter.writeFile(file, JSON.stringify(metadata, null, 2))

          return wordCount
        }
      } catch {
        // Skip malformed files
      }
    }
    return 0
  } catch (error) {
    console.error('Failed to save scene:', error)
    return 0
  }
})

/** Delete a scene and its sidecar files */
ipcMain.handle('scenes:delete', async (_event, sceneId: string): Promise<boolean> => {
  if (!currentProjectPath) return false

  try {
    const scenesDir = join(currentProjectPath, 'scenes')
    const files = await adapter.listFiles(scenesDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    for (const file of jsonFiles) {
      try {
        const raw = await adapter.readFile(file)
        const metadata = JSON.parse(raw) as SceneMetadata
        if (metadata.id === sceneId) {
          const mdPath = file.replace('.json', '.md')
          await adapter.deleteFile(file)
          await adapter.deleteFile(mdPath)
          return true
        }
      } catch {
        // Skip malformed files
      }
    }
    return false
  } catch (error) {
    console.error('Failed to delete scene:', error)
    return false
  }
})

/** Update a scene's metadata fields */
ipcMain.handle('scenes:update-metadata', async (
  _event,
  sceneId: string,
  updates: Partial<SceneMetadata>
): Promise<boolean> => {
  if (!currentProjectPath) return false

  try {
    const scenesDir = join(currentProjectPath, 'scenes')
    const files = await adapter.listFiles(scenesDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    for (const file of jsonFiles) {
      try {
        const raw = await adapter.readFile(file)
        const metadata = JSON.parse(raw) as SceneMetadata
        if (metadata.id === sceneId) {
          const updated = {
            ...metadata,
            ...updates,
            id: metadata.id,
            wordCount: metadata.wordCount,
            createdAt: metadata.createdAt,
            updatedAt: new Date().toISOString()
          }
          await adapter.writeFile(file, JSON.stringify(updated, null, 2))
          return true
        }
      } catch {
        // Skip malformed files
      }
    }
    return false
  } catch (error) {
    console.error('Failed to update scene metadata:', error)
    return false
  }
})

/** Export all scenes as a compiled manuscript .docx file */
ipcMain.handle('manuscript:export', async (): Promise<boolean> => {
  if (!currentProjectPath) return false

  try {
    // Get all scenes sorted by order
    const scenesDir = join(currentProjectPath, 'scenes')
    const files = await adapter.listFiles(scenesDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    const scenes: Array<{ metadata: SceneMetadata; content: string }> = []

    for (const file of jsonFiles) {
      try {
        const raw = await adapter.readFile(file)
        const metadata = JSON.parse(raw) as SceneMetadata
        const mdPath = file.replace('.json', '.md')
        const content = await adapter.readFile(mdPath)
        scenes.push({ metadata, content })
      } catch {
        // Skip malformed files
      }
    }

    scenes.sort((a, b) => a.metadata.order - b.metadata.order)

    if (scenes.length === 0) {
      await dialog.showMessageBox({
        type: 'info',
        title: 'No Scenes',
        message: 'There are no scenes to export.'
      })
      return false
    }

    // Ask where to save
    const result = await dialog.showSaveDialog({
      title: 'Export Manuscript',
      defaultPath: `${scenes[0].metadata.title || 'manuscript'}.docx`,
      filters: [{ name: 'Word Document', extensions: ['docx'] }]
    })

    if (result.canceled || !result.filePath) return false

    // Build document paragraphs
    const children: Paragraph[] = []

    for (const { metadata, content } of scenes) {
      // Scene title as heading
      children.push(
        new Paragraph({
          text: metadata.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 480, after: 240 }
        })
      )

      // Scene content — split into paragraphs by blank lines
      const paragraphs = content.split(/\n\n+/).filter(p => p.trim() !== '')

      for (const para of paragraphs) {
        const text = para
          .replace(/^#{1,6}\s+/, '') // Strip markdown headings
          .replace(/\*\*(.*?)\*\*/g, '$1') // Strip bold
          .replace(/\*(.*?)\*/g, '$1') // Strip italic
          .replace(/\n/g, ' ') // Join lines
          .trim()

        if (text === '') continue

        children.push(
          new Paragraph({
            children: [new TextRun({ text, size: 24 })],
            spacing: { before: 0, after: 240 },
            alignment: AlignmentType.LEFT,
            indent: { firstLine: 720 }
          })
        )
      }
    }

    // Read project metadata for title page
    const projectRaw = await adapter.readFile(join(currentProjectPath, 'project.json'))
    const project = JSON.parse(projectRaw)

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: {
              width: 12240,
              height: 15840
            },
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        children: [
          // Title page
          new Paragraph({
            children: [new TextRun({ text: project.title, size: 48, bold: true })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 2880, after: 480 }
          }),
          new Paragraph({
            children: [new TextRun({ text: project.author, size: 28 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 }
          }),
          // Scene content
          ...children
        ]
      }]
    })

    const buffer = await Packer.toBuffer(doc)
    await adapter.writeFile(result.filePath, buffer.toString('binary'))

    // Verify the file was written correctly using binary write
    const { writeFileSync } = await import('fs')
    writeFileSync(result.filePath, buffer)

    await dialog.showMessageBox({
      type: 'info',
      title: 'Export Complete',
      message: `Manuscript exported successfully.`,
      detail: `Saved to: ${result.filePath}`
    })

    return true
  } catch (error) {
    console.error('Failed to export manuscript:', error)
    await dialog.showMessageBox({
      type: 'error',
      title: 'Export Failed',
      message: 'Failed to export manuscript.',
      detail: String(error)
    })
    return false
  }
})

// ── Character Handlers ───────────────────────────────────────────────────────

/** List all characters for the current project, sorted alphabetically */
ipcMain.handle('characters:list', async (): Promise<CharacterMetadata[]> => {
  if (!currentProjectPath) return []

  try {
    const charactersDir = join(currentProjectPath, 'characters')
    const files = await adapter.listFiles(charactersDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    const characters: CharacterMetadata[] = []
    for (const file of jsonFiles) {
      try {
        const raw = await adapter.readFile(file)
        characters.push(JSON.parse(raw) as CharacterMetadata)
      } catch {
        // Skip malformed files
      }
    }

    return characters.sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error('Failed to list characters:', error)
    return []
  }
})

/** Create a new character */
ipcMain.handle('characters:create', async (
  _event,
  name: string
): Promise<CharacterMetadata | null> => {
  if (!currentProjectPath) return null

  try {
    const charactersDir = join(currentProjectPath, 'characters')

    const baseSlug = slugify(name)
    let slug = baseSlug
    let counter = 1

    while (await adapter.exists(join(charactersDir, `${slug}.json`))) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const now = new Date().toISOString()
    const metadata: CharacterMetadata = {
      id: crypto.randomUUID(),
      slug,
      name,
      aliases: [],
      tags: [],
      firstAppearance: null,
      createdAt: now,
      updatedAt: now
    }

    await adapter.writeFile(join(charactersDir, `${slug}.md`), `# ${name}\n\n`)
    await adapter.writeFile(
      join(charactersDir, `${slug}.json`),
      JSON.stringify(metadata, null, 2)
    )

    return metadata
  } catch (error) {
    console.error('Failed to create character:', error)
    return null
  }
})

/** Read a character's Markdown content */
ipcMain.handle('characters:read', async (
  _event,
  characterId: string
): Promise<string> => {
  if (!currentProjectPath) return ''

  try {
    const charactersDir = join(currentProjectPath, 'characters')
    const files = await adapter.listFiles(charactersDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    for (const file of jsonFiles) {
      try {
        const raw = await adapter.readFile(file)
        const metadata = JSON.parse(raw) as CharacterMetadata
        if (metadata.id === characterId) {
          const mdPath = file.replace('.json', '.md')
          return await adapter.readFile(mdPath)
        }
      } catch {
        // Skip malformed files
      }
    }
    return ''
  } catch (error) {
    console.error('Failed to read character:', error)
    return ''
  }
})

/** Save a character's Markdown content */
ipcMain.handle('characters:save', async (
  _event,
  characterId: string,
  content: string
): Promise<boolean> => {
  if (!currentProjectPath) return false

  try {
    const charactersDir = join(currentProjectPath, 'characters')
    const files = await adapter.listFiles(charactersDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    for (const file of jsonFiles) {
      try {
        const raw = await adapter.readFile(file)
        const metadata = JSON.parse(raw) as CharacterMetadata
        if (metadata.id === characterId) {
          const mdPath = file.replace('.json', '.md')
          await adapter.writeFile(mdPath, content)
          metadata.updatedAt = new Date().toISOString()
          await adapter.writeFile(file, JSON.stringify(metadata, null, 2))
          return true
        }
      } catch {
        // Skip malformed files
      }
    }
    return false
  } catch (error) {
    console.error('Failed to save character:', error)
    return false
  }
})

/** Delete a character */
ipcMain.handle('characters:delete', async (
  _event,
  characterId: string
): Promise<boolean> => {
  if (!currentProjectPath) return false

  try {
    const charactersDir = join(currentProjectPath, 'characters')
    const files = await adapter.listFiles(charactersDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    for (const file of jsonFiles) {
      try {
        const raw = await adapter.readFile(file)
        const metadata = JSON.parse(raw) as CharacterMetadata
        if (metadata.id === characterId) {
          await adapter.deleteFile(file)
          await adapter.deleteFile(file.replace('.json', '.md'))
          return true
        }
      } catch {
        // Skip malformed files
      }
    }
    return false
  } catch (error) {
    console.error('Failed to delete character:', error)
    return false
  }
})

/** Update a character's metadata */
ipcMain.handle('characters:update-metadata', async (
  _event,
  characterId: string,
  updates: Partial<CharacterMetadata>
): Promise<boolean> => {
  if (!currentProjectPath) return false

  try {
    const charactersDir = join(currentProjectPath, 'characters')
    const files = await adapter.listFiles(charactersDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    for (const file of jsonFiles) {
      try {
        const raw = await adapter.readFile(file)
        const metadata = JSON.parse(raw) as CharacterMetadata
        if (metadata.id === characterId) {
          const updated = {
            ...metadata,
            ...updates,
            id: metadata.id,
            slug: metadata.slug,
            createdAt: metadata.createdAt,
            updatedAt: new Date().toISOString()
          }
          await adapter.writeFile(file, JSON.stringify(updated, null, 2))
          return true
        }
      } catch {
        // Skip malformed files
      }
    }
    return false
  } catch (error) {
    console.error('Failed to update character metadata:', error)
    return false
  }
})

// ── Location Handlers ────────────────────────────────────────────────────────

/** List all locations for the current project, sorted alphabetically */
ipcMain.handle('locations:list', async (): Promise<LocationMetadata[]> => {
  if (!currentProjectPath) return []

  try {
    const locationsDir = join(currentProjectPath, 'locations')
    const files = await adapter.listFiles(locationsDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    const locations: LocationMetadata[] = []
    for (const file of jsonFiles) {
      try {
        const raw = await adapter.readFile(file)
        locations.push(JSON.parse(raw) as LocationMetadata)
      } catch {
        // Skip malformed files
      }
    }

    return locations.sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error('Failed to list locations:', error)
    return []
  }
})

/** Create a new location */
ipcMain.handle('locations:create', async (
  _event,
  name: string
): Promise<LocationMetadata | null> => {
  if (!currentProjectPath) return null

  try {
    const locationsDir = join(currentProjectPath, 'locations')

    const baseSlug = slugify(name)
    let slug = baseSlug
    let counter = 1

    while (await adapter.exists(join(locationsDir, `${slug}.json`))) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const now = new Date().toISOString()
    const metadata: LocationMetadata = {
      id: crypto.randomUUID(),
      slug,
      name,
      tags: [],
      mapImage: null,
      createdAt: now,
      updatedAt: now
    }

    await adapter.writeFile(join(locationsDir, `${slug}.md`), `# ${name}\n\n`)
    await adapter.writeFile(
      join(locationsDir, `${slug}.json`),
      JSON.stringify(metadata, null, 2)
    )

    return metadata
  } catch (error) {
    console.error('Failed to create location:', error)
    return null
  }
})

/** Read a location's Markdown content */
ipcMain.handle('locations:read', async (
  _event,
  locationId: string
): Promise<string> => {
  if (!currentProjectPath) return ''

  try {
    const locationsDir = join(currentProjectPath, 'locations')
    const files = await adapter.listFiles(locationsDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    for (const file of jsonFiles) {
      try {
        const raw = await adapter.readFile(file)
        const metadata = JSON.parse(raw) as LocationMetadata
        if (metadata.id === locationId) {
          return await adapter.readFile(file.replace('.json', '.md'))
        }
      } catch {
        // Skip malformed files
      }
    }
    return ''
  } catch (error) {
    console.error('Failed to read location:', error)
    return ''
  }
})

/** Save a location's Markdown content */
ipcMain.handle('locations:save', async (
  _event,
  locationId: string,
  content: string
): Promise<boolean> => {
  if (!currentProjectPath) return false

  try {
    const locationsDir = join(currentProjectPath, 'locations')
    const files = await adapter.listFiles(locationsDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    for (const file of jsonFiles) {
      try {
        const raw = await adapter.readFile(file)
        const metadata = JSON.parse(raw) as LocationMetadata
        if (metadata.id === locationId) {
          await adapter.writeFile(file.replace('.json', '.md'), content)
          metadata.updatedAt = new Date().toISOString()
          await adapter.writeFile(file, JSON.stringify(metadata, null, 2))
          return true
        }
      } catch {
        // Skip malformed files
      }
    }
    return false
  } catch (error) {
    console.error('Failed to save location:', error)
    return false
  }
})

/** Delete a location */
ipcMain.handle('locations:delete', async (
  _event,
  locationId: string
): Promise<boolean> => {
  if (!currentProjectPath) return false

  try {
    const locationsDir = join(currentProjectPath, 'locations')
    const files = await adapter.listFiles(locationsDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    for (const file of jsonFiles) {
      try {
        const raw = await adapter.readFile(file)
        const metadata = JSON.parse(raw) as LocationMetadata
        if (metadata.id === locationId) {
          await adapter.deleteFile(file)
          await adapter.deleteFile(file.replace('.json', '.md'))
          return true
        }
      } catch {
        // Skip malformed files
      }
    }
    return false
  } catch (error) {
    console.error('Failed to delete location:', error)
    return false
  }
})

/** Update a location's metadata */
ipcMain.handle('locations:update-metadata', async (
  _event,
  locationId: string,
  updates: Partial<LocationMetadata>
): Promise<boolean> => {
  if (!currentProjectPath) return false

  try {
    const locationsDir = join(currentProjectPath, 'locations')
    const files = await adapter.listFiles(locationsDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    for (const file of jsonFiles) {
      try {
        const raw = await adapter.readFile(file)
        const metadata = JSON.parse(raw) as LocationMetadata
        if (metadata.id === locationId) {
          const updated = {
            ...metadata,
            ...updates,
            id: metadata.id,
            slug: metadata.slug,
            createdAt: metadata.createdAt,
            updatedAt: new Date().toISOString()
          }
          await adapter.writeFile(file, JSON.stringify(updated, null, 2))
          return true
        }
      } catch {
        // Skip malformed files
      }
    }
    return false
  } catch (error) {
    console.error('Failed to update location metadata:', error)
    return false
  }
})

// Windows: quit the app when all windows are closed
app.on('window-all-closed', () => {
  app.quit()
})