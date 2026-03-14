import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../renderer/types/ipc'

const api: ElectronAPI = {
  // Asset tree
  scanAssets: () => ipcRenderer.invoke('scan-assets'),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),

  // Prompt building
  buildPrompt: (assetId: string) => ipcRenderer.invoke('build-prompt', assetId),

  // Generation
  generate: (assetId, prompt, modelId, filename) =>
    ipcRenderer.invoke('generate', assetId, prompt, modelId, filename),

  // Image management
  getImagesForAsset: (assetId: string) => ipcRenderer.invoke('get-images-for-asset', assetId),
  getActiveSelections: () => ipcRenderer.invoke('get-active-selections'),
  setActiveSelection: (assetId: string, imagePath: string) =>
    ipcRenderer.invoke('set-active-selection', assetId, imagePath),

  // Connectable variants
  getConnectableVariantIds: (connectableDir: string) =>
    ipcRenderer.invoke('get-connectable-variant-ids', connectableDir),

  // Tilemap
  getConnectableVariantImages: (connectableDir: string, model: string) =>
    ipcRenderer.invoke('get-connectable-variant-images', connectableDir, model),
  getBaseTileImage: (model: string) =>
    ipcRenderer.invoke('get-base-tile-image', model),
  getConnectableMaskImages: () =>
    ipcRenderer.invoke('get-connectable-mask-images'),
  getBaseTileMaskImage: () =>
    ipcRenderer.invoke('get-base-tile-mask-image'),

  // File watch events
  onTreeChanged: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('tree:changed', handler)
    return () => ipcRenderer.removeListener('tree:changed', handler)
  },
  onFileChanged: (callback: (filePath: string) => void) => {
    const handler = (_: unknown, filePath: string) => callback(filePath)
    ipcRenderer.on('file:changed', handler)
    return () => ipcRenderer.removeListener('file:changed', handler)
  },
  onImagesChanged: (callback: (assetId: string) => void) => {
    const handler = (_: unknown, assetId: string) => callback(assetId)
    ipcRenderer.on('images:changed', handler)
    return () => ipcRenderer.removeListener('images:changed', handler)
  },
  onGenerationUpdate: (callback: (job: any) => void) => {
    const handler = (_: unknown, job: any) => callback(job)
    ipcRenderer.on('generation:update', handler)
    return () => ipcRenderer.removeListener('generation:update', handler)
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)
