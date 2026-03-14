import { useState, useEffect } from 'react'
import { useAssetStore } from '../../stores/asset-store'
import { useGenerationStore } from '../../stores/generation-store'
import { ImageCard, MagentaStrippedImage } from './ImageCard'
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
  const [showMasks, setShowMasks] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<ImageInfo | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1)
  const [variantImages, setVariantImages] = useState<Record<string, string>>({})
  const [baseTileImage, setBaseTileImage] = useState<string | null>(null)
  const [maskImages, setMaskImages] = useState<Record<string, string>>({})
  const [baseMaskImage, setBaseMaskImage] = useState<string | null>(null)

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

  // Load mask images once when connectable type is set
  useEffect(() => {
    if (!connectableType) {
      setMaskImages({})
      setBaseMaskImage(null)
      return
    }
    window.electronAPI.getConnectableMaskImages().then(setMaskImages)
    window.electronAPI.getBaseTileMaskImage().then(setBaseMaskImage)
  }, [connectableType])

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

  // Spacebar opens lightbox for selected image
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && selectedImageIndex >= 0 && images[selectedImageIndex]) {
        e.preventDefault()
        setLightboxImage(lightboxImage ? null : images[selectedImageIndex])
      }
      if (e.code === 'Escape' && lightboxImage) {
        setLightboxImage(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedImageIndex, images, lightboxImage])

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
            {!showMasks && (
              <>
                <span>Model:</span>
                <select
                  value={tilemapModel}
                  onChange={(e) => setTilemapModel(e.target.value)}
                >
                  {MODELS.map((m) => (
                    <option key={m.shortName} value={m.shortName}>{m.displayName}</option>
                  ))}
                </select>
              </>
            )}
            <label className="mask-toggle">
              <input
                type="checkbox"
                checked={showMasks}
                onChange={(e) => setShowMasks(e.target.checked)}
              />
              Show masks
            </label>
          </div>
          <TilemapPreview
            variantImages={showMasks ? maskImages : variantImages}
            baseTileImage={showMasks ? baseMaskImage : baseTileImage}
          />
        </>
      )}

      {images.length === 0 && activeJobs.length === 0 && !connectableType && (
        <div className="pane-placeholder">No images generated yet</div>
      )}

      <div className="image-grid">
        {images.map((img, i) => (
          <ImageCard
            key={img.path}
            image={img}
            isSelected={i === selectedImageIndex}
            onSelect={() => setSelectedImageIndex(i)}
            onSetActive={() => handleSetActive(img.path)}
          />
        ))}
      </div>

      {lightboxImage && (
        <div className="lightbox" onClick={() => setLightboxImage(null)}>
          <MagentaStrippedImage
            src={`asset://${encodeURIComponent(lightboxImage.path)}`}
            alt={lightboxImage.filename}
            className="lightbox-image"
          />
        </div>
      )}
    </div>
  )
}
