import { app, shell, BrowserWindow, dialog, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'
import { ElectronAdapter } from '../../src-shared/storage/ElectronAdapter'
import type { ProjectMetadata } from '../../src-shared/types'


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

    return metadata
  } catch (error) {
    console.error('Failed to create project:', error)
    return null
  }
})

// Windows: quit the app when all windows are closed
app.on('window-all-closed', () => {
  app.quit()
})