import { app, shell, BrowserWindow, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'

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

// Windows: quit the app when all windows are closed
app.on('window-all-closed', () => {
  app.quit()
})