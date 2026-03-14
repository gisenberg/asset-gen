import chokidar from 'chokidar'
import path from 'path'
import type { BrowserWindow } from 'electron'

const ASSETS_DIR = path.join(process.cwd(), 'assets')
const GENERATED_DIR = path.join(process.cwd(), 'generated_images')

let assetsWatcher: chokidar.FSWatcher | null = null
let imagesWatcher: chokidar.FSWatcher | null = null

type WindowGetter = () => BrowserWindow | null

export function startFileWatcher(getWindow: WindowGetter) {
  // Debounce helper
  const debounce = (fn: () => void, ms: number) => {
    let timer: ReturnType<typeof setTimeout>
    return () => {
      clearTimeout(timer)
      timer = setTimeout(fn, ms)
    }
  }

  // Watch assets/ directory
  assetsWatcher = chokidar.watch(ASSETS_DIR, {
    ignoreInitial: true,
    ignored: /(^|[/\\])\../
  })

  const notifyTreeChanged = debounce(() => {
    getWindow()?.webContents.send('tree:changed')
  }, 300)

  const notifyFileChanged = debounce(() => {
    // For file content changes, we send the event immediately with the path
    // The debounce here is per-watcher, not per-file
  }, 300)

  assetsWatcher
    .on('add', notifyTreeChanged)
    .on('unlink', notifyTreeChanged)
    .on('change', (filePath) => {
      getWindow()?.webContents.send('file:changed', filePath)
    })

  // Watch generated_images/ directory
  imagesWatcher = chokidar.watch(GENERATED_DIR, {
    ignoreInitial: true,
    ignored: [/(^|[/\\])\./, /\.json$/]
  })

  const notifyImagesChanged = debounce(() => {
    getWindow()?.webContents.send('images:changed', '')
  }, 300)

  imagesWatcher
    .on('add', notifyImagesChanged)
    .on('unlink', notifyImagesChanged)
}

export function stopFileWatcher() {
  assetsWatcher?.close()
  imagesWatcher?.close()
  assetsWatcher = null
  imagesWatcher = null
}
