import { useEffect, useRef, useState } from 'react'

interface TilemapPreviewProps {
  variantImages: Record<string, string>
  baseTileImage: string | null
}

// Layout showing all connectable variants in a coherent network.
// Edges: N=top-right, E=bottom-right, S=bottom-left, W=top-left
// Adjacency: col+1 shares E↔W edges, row+1 shares S↔N edges.
// End tiles have one connection edge pointing inward toward the path.
const TILEMAP: (string | null)[][] = [
  [null,         null,          null,         'end_s',        null,            null,          null],
  [null,         null,          null,         'straight_ns',  null,            null,          null],
  ['end_e',      'straight_ew', 'corner_ne',  'tjunction_nsw','corner_nw',    'straight_ew', 'end_w'],
  [null,         null,          'straight_ns','crossroads',   'straight_ns',  null,          null],
  [null,         null,          'corner_se',  'tjunction_nes','tjunction_esw','corner_sw',   null],
  [null,         null,          null,         'straight_ns',  'straight_ns',  null,          null],
  [null,         null,          null,         'end_n',        'tjunction_new','straight_ew', 'end_w'],
]

// The diamond in each 1024x1024 source image is 820x410 centered at (512, 512).
const SRC_SIZE = 1024
const DIAMOND_W = 820
const DIAMOND_H = 410

// Render each diamond at this width
const RENDER_DIAMOND_W = 128
const RENDER_SCALE = RENDER_DIAMOND_W / DIAMOND_W
const RENDER_DIAMOND_H = DIAMOND_H * RENDER_SCALE
const RENDER_IMG_SIZE = SRC_SIZE * RENDER_SCALE

// Diamond center offset within the rendered image
const CENTER_X = 512 * RENDER_SCALE
const CENTER_Y = 512 * RENDER_SCALE

export function TilemapPreview({ variantImages, baseTileImage }: TilemapPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scale, setScale] = useState(1)

  const rows = TILEMAP.length
  const cols = TILEMAP[0].length

  // Canvas size: enough to hold the isometric grid
  const gridW = (cols + rows) * (RENDER_DIAMOND_W / 2)
  const gridH = (cols + rows) * (RENDER_DIAMOND_H / 2)
  // Add padding for image overflow beyond the diamond
  const padX = RENDER_IMG_SIZE / 2
  const padY = RENDER_IMG_SIZE / 2
  const canvasW = Math.ceil(gridW + padX * 2)
  const canvasH = Math.ceil(gridH + padY * 2)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvasW
    canvas.height = canvasH

    const imageNames = new Set<string>()
    for (const row of TILEMAP) {
      for (const cell of row) {
        if (cell) imageNames.add(cell)
      }
    }

    const loadedImages: Record<string, HTMLImageElement> = {}
    let loadCount = 0
    const totalToLoad = imageNames.size + (baseTileImage ? 1 : 0)
    if (totalToLoad === 0) {
      ctx.fillStyle = '#2a2a2a'
      ctx.fillRect(0, 0, canvasW, canvasH)
      ctx.fillStyle = '#666'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('No images available for this model', canvasW / 2, canvasH / 2)
      return
    }

    const tryRender = () => {
      loadCount++
      if (loadCount >= totalToLoad) {
        render(ctx, canvasW, canvasH, rows, cols, loadedImages, padX, padY)
      }
    }

    for (const name of imageNames) {
      const src = variantImages[name]
      if (!src) { loadCount++; continue }
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => { loadedImages[name] = img; tryRender() }
      img.onerror = tryRender
      img.src = src
    }

    if (baseTileImage) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => { loadedImages['__base'] = img; tryRender() }
      img.onerror = tryRender
      img.src = baseTileImage
    }
  }, [variantImages, baseTileImage, canvasW, canvasH])

  return (
    <div className="tilemap-preview">
      <div className="tilemap-label">Tilemap Preview</div>
      <div className="tilemap-canvas-wrapper">
        <canvas
          ref={canvasRef}
          style={{
            width: canvasW * scale,
            height: canvasH * scale,
          }}
        />
      </div>
      <div className="tilemap-controls">
        <button onClick={() => setScale((s) => Math.max(0.25, s - 0.25))}>-</button>
        <span>{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale((s) => Math.min(3, s + 0.25))}>+</button>
      </div>
    </div>
  )
}

/** Make magenta (#FF00FF) pixels transparent in an image */
function stripMagenta(img: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h)
  const px = data.data
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i + 1], b = px[i + 2]
    // Magenta: high red, low green, high blue
    if (r > 200 && g < 60 && b > 200) {
      px[i + 3] = 0 // set alpha to 0
    }
  }
  ctx.putImageData(data, 0, 0)
  return c
}

function render(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rows: number,
  cols: number,
  images: Record<string, HTMLImageElement>,
  padX: number,
  padY: number
) {
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#2a2a2a'
  ctx.fillRect(0, 0, width, height)

  // Pre-process all images to strip magenta
  const processed: Record<string, HTMLCanvasElement> = {}
  for (const [key, img] of Object.entries(images)) {
    processed[key] = stripMagenta(img, Math.ceil(RENDER_IMG_SIZE), Math.ceil(RENDER_IMG_SIZE))
  }

  // Draw tiles back-to-front (row by row, left to right)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = TILEMAP[row][col]
      const src = cell ? processed[cell] : processed['__base']
      if (!src) continue

      // Isometric grid: diamond center position
      const cx = padX + (col - row) * (RENDER_DIAMOND_W / 2) + (rows - 1) * (RENDER_DIAMOND_W / 2)
      const cy = padY + (col + row) * (RENDER_DIAMOND_H / 2)

      // Draw the image centered on the diamond center
      const drawX = cx - CENTER_X
      const drawY = cy - CENTER_Y

      ctx.drawImage(src, drawX, drawY, Math.ceil(RENDER_IMG_SIZE), Math.ceil(RENDER_IMG_SIZE))
    }
  }
}
