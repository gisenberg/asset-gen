import { useState } from 'react'
import type { ImageInfo } from '../../types/ipc'

interface ImageCardProps {
  image: ImageInfo
  onSetActive: () => void
}

export function ImageCard({ image, onSetActive }: ImageCardProps) {
  const [showPrompt, setShowPrompt] = useState(false)

  const displayTime = image.createdAt
    ? new Date(image.createdAt).toLocaleString()
    : image.timestamp
      ? new Date(image.timestamp.replace(/-/g, ':')).toLocaleString()
      : ''

  return (
    <div className={`image-card ${image.isActive ? 'active' : ''}`}>
      <div className="image-wrapper" onClick={onSetActive}>
        <img
          src={`asset://${encodeURIComponent(image.path)}`}
          alt={image.filename}
          loading="lazy"
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
