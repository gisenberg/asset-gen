import { useState, useEffect } from 'react'
import { useAssetStore } from '../../stores/asset-store'
import { useGenerationStore } from '../../stores/generation-store'
import { ImageCard } from './ImageCard'
import { GenerationStatus } from './GenerationStatus'
import type { ImageInfo } from '../../types/ipc'
import './PreviewPane.css'

export function PreviewPane() {
  const selectedAsset = useAssetStore((s) => s.selectedAsset)
  const jobs = useGenerationStore((s) => s.jobs)
  const [images, setImages] = useState<ImageInfo[]>([])

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

  // Listen for image changes
  useEffect(() => {
    const handler = () => loadImages()
    window.addEventListener('images-changed', handler)
    return () => window.removeEventListener('images-changed', handler)
  }, [selectedAsset])

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

      {images.length === 0 && activeJobs.length === 0 && (
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
