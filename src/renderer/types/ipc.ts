import type { AssetNode } from './asset'
import type { GenerationJob, ModelId } from './generation'

export interface ElectronAPI {
  // Asset tree
  scanAssets(): Promise<AssetNode[]>
  readFile(filePath: string): Promise<string>
  writeFile(filePath: string, content: string): Promise<void>

  // Prompt building
  buildPrompt(assetId: string): Promise<string>

  // Generation
  generate(assetId: string, prompt: string, modelId: ModelId, filename: string): Promise<GenerationJob>

  // Image management
  getImagesForAsset(assetId: string): Promise<ImageInfo[]>
  getActiveSelections(): Promise<Record<string, string>>
  setActiveSelection(assetId: string, imagePath: string): Promise<void>

  // File watch events (push from main → renderer)
  onTreeChanged(callback: () => void): () => void
  onFileChanged(callback: (filePath: string) => void): () => void
  onImagesChanged(callback: (assetId: string) => void): () => void
  onGenerationUpdate(callback: (job: GenerationJob) => void): () => void
}

export interface ImageInfo {
  path: string
  filename: string
  assetId: string
  model: string
  timestamp: string
  isActive: boolean
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
