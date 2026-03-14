import { useState, useEffect } from 'react'
import { useAssetStore } from '../../stores/asset-store'
import { useGenerationStore } from '../../stores/generation-store'
import { ImageCard } from './ImageCard'
import { GenerationStatus } from './GenerationStatus'
import { TilemapPreview } from './TilemapPreview'
import { MODELS } from '../../types/generation'
import type { ImageInfo } from '../../types/ipc'
import './PreviewPane.css'

/** Extract the connectable type name (e.g. "river") from an asset ID if it's a connectable */
function getConnectableType(assetId: string): string | null {
  // tiles/connectable/river/straight_ew → "river"
  // tiles/connectable/river → "river" (category node)
  const match = assetId.match(/^tiles\/connectable\/([^/]+)/)
  return match ? match[1] : null
}

export function PreviewPane() {
  const selectedAsset = useAssetStore((s) => s.selectedAsset)
  const selectedModel = useGenerationStore((s) => s.selectedModel)
  const jobs = useGenerationStore((s) => s.jobs)
  const [images, setImages] = useState<ImageInfo[]>([])
  const [tilemapModel, setTilemapModel] = useState(selectedModel.shortName)
  const [variantImages, setVariantImages] = useState<Record<string, string>>({})
  const [baseTileImage, setBaseTileImage] = useState<string | null>(null)

  const connectableType = selectedAsset ? getConnectableType(selectedAsset.id) : null

  const loadImages = async () => {
    if (!selectedAsset) {
      setImages([])
      return
    }
    const imgs = await window.electronAPI.getImagesForAsset(selectedAsset.id)
    setImages(imgs)
  }

  useEffect(() => {
    loadImages()
  }, [selectedAsset])

  // Load tilemap images when connectable type or model changes
  useEffect(() => {
    if (!connectableType) {
      setVariantImages({})
      setBaseTileImage(null)
      return
    }
    window.electronAPI.getConnectableVariantImages(connectableType, tilemapModel).then(setVariantImages)
    window.electronAPI.getBaseTileImage(tilemapModel).then(setBaseTileImage)
  }, [connectableType, tilemapModel])

  // Listen for image changes
  useEffect(() => {
    const handler = () => {
      loadImages()
      if (connectableType) {
        window.electronAPI.getConnectableVariantImages(connectableType, tilemapModel).then(setVariantImages)
        window.electronAPI.getBaseTileImage(tilemapModel).then(setBaseTileImage)
      }
    }
    window.addEventListener('images-changed', handler)
    return () => window.removeEventListener('images-changed', handler)
  }, [selectedAsset, connectableType, tilemapModel])

  // Refresh when generation completes
  useEffect(() => {
    const completedJob = jobs.find(
      (j) => j.status === 'completed' && j.assetId === selectedAsset?.id
    )
    if (completedJob) loadImages()
  }, [jobs, selectedAsset])

  const handleSetActive = async (imagePath: string) => {
    if (!selectedAsset) return
    await window.electronAPI.setActiveSelection(selectedAsset.id, imagePath)
    loadImages()
  }

  if (!selectedAsset) {
    return <div className="pane-placeholder">Select an asset to view images</div>
  }

  const activeJobs = jobs.filter(
    (j) => j.assetId === selectedAsset.id && (j.status === 'generating' || j.status === 'queued')
  )

  return (
    <div className="preview-pane">
      <div className="preview-header">
        Preview: {selectedAsset.name}
      </div>

      {activeJobs.map((job) => (
        <GenerationStatus key={job.id} job={job} />
      ))}

      {connectableType && (
        <>
          <div className="tilemap-model-selector">
            <span>Tilemap model:</span>
            <select
              value={tilemapModel}
              onChange={(e) => setTilemapModel(e.target.value)}
            >
              {MODELS.map((m) => (
                <option key={m.shortName} value={m.shortName}>{m.displayName}</option>
              ))}
            </select>
          </div>
          <TilemapPreview variantImages={variantImages} baseTileImage={baseTileImage} />
        </>
      )}

      {images.length === 0 && activeJobs.length === 0 && !connectableType && (
        <div className="pane-placeholder">No images generated yet</div>
      )}

      <div className="image-grid">
        {images.map((img) => (
          <ImageCard
            key={img.path}
            image={img}
            onSetActive={() => handleSetActive(img.path)}
          />
        ))}
      </div>
    </div>
  )
}
