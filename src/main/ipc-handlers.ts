import { ipcMain } from 'electron'
import { scanAssetsDir } from './asset-scanner'
import { buildPromptForAsset } from './prompt-builder'
import { getImagesForAsset, getActiveSelections, setActiveSelection, getConnectableVariantImages, getBaseTileImage } from './image-manager'
import { generateWithMcp } from './mcp-client'
import fs from 'fs/promises'
import path from 'path'

const ASSETS_DIR = path.join(process.cwd(), 'assets')
const GENERATED_DIR = path.join(process.cwd(), 'generated_images')

export function registerIpcHandlers() {
  ipcMain.handle('scan-assets', async () => {
    return scanAssetsDir(ASSETS_DIR)
  })

  ipcMain.handle('read-file', async (_event, filePath: string) => {
    return fs.readFile(filePath, 'utf-8')
  })

  ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
    await fs.writeFile(filePath, content, 'utf-8')
  })

  ipcMain.handle('build-prompt', async (_event, assetId: string) => {
    const result = await buildPromptForAsset(ASSETS_DIR, assetId)
    return result.text
  })

  ipcMain.handle('generate', async (_event, assetId: string, _prompt: string, modelId: string, filename: string) => {
    const { text, maskPath } = await buildPromptForAsset(ASSETS_DIR, assetId)
    return generateWithMcp(assetId, text, modelId, filename, maskPath)
  })

  ipcMain.handle('get-images-for-asset', async (_event, assetId: string) => {
    return getImagesForAsset(assetId)
  })

  ipcMain.handle('get-active-selections', async () => {
    return getActiveSelections()
  })

  ipcMain.handle('set-active-selection', async (_event, assetId: string, imagePath: string) => {
    return setActiveSelection(assetId, imagePath)
  })

  ipcMain.handle('get-connectable-variant-ids', async (_event, connectableDir: string) => {
    // Scan for .md files (excluding _*.md descriptors) under tiles/connectable/{dir}/
    const dir = path.join(ASSETS_DIR, 'tiles', 'connectable', connectableDir)
    try {
      const entries = await fs.readdir(dir)
      return entries
        .filter((e) => e.endsWith('.md') && !e.startsWith('_'))
        .map((e) => `tiles/connectable/${connectableDir}/${e.replace(/\.md$/, '')}`)
        .sort()
    } catch {
      return []
    }
  })

  ipcMain.handle('get-connectable-variant-images', async (_event, connectableDir: string, model: string) => {
    return getConnectableVariantImages(GENERATED_DIR, connectableDir, model)
  })

  ipcMain.handle('get-base-tile-image', async (_event, model: string) => {
    return getBaseTileImage(GENERATED_DIR, model)
  })

  ipcMain.handle('get-connectable-mask-images', async () => {
    const masksDir = path.join(ASSETS_DIR, 'tiles', 'connectable', 'masks')
    const result: Record<string, string> = {}
    try {
      const files = await fs.readdir(masksDir)
      for (const file of files) {
        if (!/\.(png|jpg|jpeg)$/i.test(file)) continue
        const variant = file.replace(/\.\w+$/, '')
        result[variant] = `asset://${encodeURIComponent(path.join(masksDir, file))}`
      }
    } catch {}
    return result
  })

  ipcMain.handle('get-base-tile-mask-image', async () => {
    const maskPath = path.join(ASSETS_DIR, 'tiles', 'tile_mask.png')
    try {
      await fs.access(maskPath)
      return `asset://${encodeURIComponent(maskPath)}`
    } catch {
      return null
    }
  })
}
