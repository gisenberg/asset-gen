import type { ImageInfo } from '../../types/ipc'

interface ImageCardProps {
  image: ImageInfo
  onSetActive: () => void
}

export function ImageCard({ image, onSetActive }: ImageCardProps) {
  const timestamp = image.timestamp
    ? new Date(image.timestamp.replace(/-/g, ':')).toLocaleString()
    : ''

  return (
    <div
      className={`image-card ${image.isActive ? 'active' : ''}`}
      onClick={onSetActive}
    >
      <div className="image-wrapper">
        <img
          src={`asset://${encodeURIComponent(image.path)}`}
          alt={image.filename}
          loading="lazy"
        />
        {image.isActive && <span className="active-badge">★</span>}
      </div>
      <div className="image-meta">
        <span className="image-model">{image.model}</span>
        {timestamp && <span className="image-time">{timestamp}</span>}
      </div>
    </div>
  )
}
