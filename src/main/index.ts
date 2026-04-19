import { app, shell, BrowserWindow, dialog, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'
import { ElectronAdapter } from '../../src-shared/storage/ElectronAdapter'
import type { ProjectMetadata, SceneMetadata } from '../../src-shared/types'


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

// Windows: quit the app when all windows are closed
app.on('window-all-closed', () => {
  app.quit()
})