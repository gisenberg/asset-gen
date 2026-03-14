import { useState, useRef, useEffect } from 'react'
import type { ImageInfo } from '../../types/ipc'

interface ImageCardProps {
  image: ImageInfo
  isSelected?: boolean
  onSelect?: () => void
  onSetActive: () => void
}

/** Parse filename timestamp like "2026-03-14T01-10-39-967Z" into a display string */
function formatFilenameTimestamp(ts: string): string {
  // 2026-03-14T01-10-39-967Z → 2026-03-14T01:10:39.967Z
  const match = ts.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d+)Z$/)
  if (match) {
    const iso = `${match[1]}T${match[2]}:${match[3]}:${match[4]}.${match[5]}Z`
    const d = new Date(iso)
    if (!isNaN(d.getTime())) return d.toLocaleString()
  }
  return ts
}

export function MagentaStrippedImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const data = ctx.getImageData(0, 0, img.width, img.height)
      const px = data.data
      for (let i = 0; i < px.length; i += 4) {
        if (px[i] > 150 && px[i + 1] < 100 && px[i + 2] > 150) {
          px[i + 3] = 0
        }
      }
      ctx.putImageData(data, 0, 0)
    }
    img.src = src
  }, [src])

  return <canvas ref={canvasRef} className={className} style={className ? undefined : { width: '100%', height: '100%', objectFit: 'contain' }} />
}

export function ImageCard({ image, isSelected, onSelect, onSetActive }: ImageCardProps) {
  const [showPrompt, setShowPrompt] = useState(false)

  const displayTime = image.createdAt
    ? new Date(image.createdAt).toLocaleString()
    : image.timestamp
      ? formatFilenameTimestamp(image.timestamp)
      : ''

  return (
    <div className={`image-card ${image.isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`} onClick={onSelect} onDoubleClick={onSetActive}>
      <div className="image-wrapper">
        <MagentaStrippedImage
          src={`asset://${encodeURIComponent(image.path)}`}
          alt={image.filename}
        />
        {image.isActive && <span className="active-badge">★</span>}
      </div>
      <div className="image-meta">
        <span className="image-model">{image.model}</span>
        {displayTime && <span className="image-time">{displayTime}</span>}
        {image.prompt && (
          <button
            className="prompt-toggle"
            onClick={(e) => { e.stopPropagation(); setShowPrompt(!showPrompt) }}
          >
            {showPrompt ? '▼ Prompt' : '▶ Prompt'}
          </button>
        )}
      </div>
      {showPrompt && image.prompt && (
        <div className="image-prompt">{image.prompt}</div>
      )}
    </div>
  )
}
