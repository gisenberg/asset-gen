import { app, BrowserWindow, protocol, net } from 'electron'
import path from 'path'
import { registerIpcHandlers } from './ipc-handlers'
import { startFileWatcher, stopFileWatcher } from './file-watcher'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1e1e1e',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Register custom asset:// protocol for serving images
protocol.registerSchemesAsPrivileged([
  { scheme: 'asset', privileges: { bypassCSP: true, stream: true, supportFetchAPI: true } }
])

app.whenReady().then(() => {
  // Handle asset:// URLs — serves files from generated_images/
  protocol.handle('asset', (request) => {
    const filePath = decodeURIComponent(request.url.replace('asset://', ''))
    return net.fetch(`file://${filePath}`)
  })

  createWindow()
  registerIpcHandlers()
  startFileWatcher(() => mainWindow)
})

app.on('window-all-closed', () => {
  stopFileWatcher()
  app.quit()
})

export { mainWindow }
