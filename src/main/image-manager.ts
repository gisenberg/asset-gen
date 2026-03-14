import fs from 'fs/promises'
import path from 'path'
import type { ImageInfo } from '../renderer/types/ipc'

const GENERATED_DIR = path.join(process.cwd(), 'generated_images')
const SELECTIONS_FILE = path.join(GENERATED_DIR, '.active-selections.json')

// Mapping from asset ID to filename prefix patterns
// tiles/grass → tile_grass, props/boulder → item_boulder
// tiles/connectable/river/straight_ew → tile_river_straight_ew
function assetIdToPrefixes(assetId: string): string[] {
  const parts = assetId.split('/')
  const category = parts[0]
  const prefix = category === 'tiles' ? 'tile' : 'item'

  // For deeply nested assets, skip intermediate directory names that are categories
  // tiles/connectable/river/straight_ew → tile_river_straight_ew (skip "connectable")
  const nameParts = parts.slice(1).filter((p) => !['connectable'].includes(p))
  const fullPrefix = `${prefix}_${nameParts.join('_')}`

  // Also generate a short prefix using just the first word of the leaf name
  // to match legacy Python-generated filenames (e.g., tile_dirt for dirt_path)
  const leafName = nameParts[nameParts.length - 1]
  const firstWord = leafName.split('_')[0]
  const shortPrefix = nameParts.length > 1
    ? `${prefix}_${[...nameParts.slice(0, -1), firstWord].join('_')}`
    : `${prefix}_${firstWord}`

  const prefixes = [fullPrefix]
  if (shortPrefix !== fullPrefix) prefixes.push(shortPrefix)
  return prefixes
}

function fileMatchesAsset(filename: string, prefixes: string[]): boolean {
  // A file matches if it starts with any prefix followed by _ or .
  // This prevents "tile_dirt" from matching "tile_dirty_*"
  return prefixes.some((p) =>
    filename.startsWith(p + '_') || filename.startsWith(p + '.')
  )
}

export async function getImagesForAsset(assetId: string): Promise<ImageInfo[]> {
  const prefixes = assetIdToPrefixes(assetId)
  const selections = await getActiveSelections()
  const activePath = selections[assetId]

  try {
    const files = await fs.readdir(GENERATED_DIR)
    const images: ImageInfo[] = []

    for (const file of files) {
      if (!fileMatchesAsset(file, prefixes)) continue
      if (!file.match(/\.(png|jpg|jpeg)$/i)) continue

      const fullPath = path.join(GENERATED_DIR, file)
      const parsed = parseImageFilename(file)

      images.push({
        path: fullPath,
        filename: file,
        assetId,
        model: parsed.model,
        timestamp: parsed.timestamp,
        isActive: fullPath === activePath
      })
    }

    // Sort by timestamp descending (newest first)
    images.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    return images
  } catch {
    return []
  }
}

interface ParsedFilename {
  model: string
  timestamp: string
}

function parseImageFilename(filename: string): ParsedFilename {
  // Format: prefix_model_timestamp_N.ext
  // e.g., tile_grass_nb1_2026-03-14T01-06-20-970Z_1.png
  // or: tile_grass_v2.png (legacy format)
  const match = filename.match(/_(?:nb1|nb2|nbpro|v\d+)_/)
  if (match) {
    const modelStart = match.index! + 1
    const afterModel = filename.indexOf('_', modelStart)
    const model = filename.substring(modelStart, afterModel)

    // Extract timestamp (everything between model and last _N.ext)
    const rest = filename.substring(afterModel + 1)
    const timestampMatch = rest.match(/^(.+?)_\d+\.\w+$/)
    const timestamp = timestampMatch ? timestampMatch[1] : ''

    return { model, timestamp }
  }

  // Legacy format: prefix_v2.ext
  const legacyMatch = filename.match(/_v(\d+)\.\w+$/)
  if (legacyMatch) {
    return { model: `v${legacyMatch[1]}`, timestamp: '' }
  }

  return { model: 'unknown', timestamp: '' }
}

export async function getActiveSelections(): Promise<Record<string, string>> {
  try {
    const data = await fs.readFile(SELECTIONS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return {}
  }
}

export async function setActiveSelection(assetId: string, imagePath: string): Promise<void> {
  const selections = await getActiveSelections()
  selections[assetId] = imagePath
  await fs.writeFile(SELECTIONS_FILE, JSON.stringify(selections, null, 2))
}

/**
 * Get asset:// URLs for all connectable variant images of a given type and model.
 * connectableDir is e.g. "river". model is e.g. "nb1".
 * Returns { "straight_ew": "asset://...", "corner_ne": "asset://...", ... }
 */
export async function getConnectableVariantImages(
  generatedDir: string,
  connectableDir: string,
  model: string
): Promise<Record<string, string>> {
  const variants: Record<string, string> = {}
  const prefix = `tile_${connectableDir}_`

  try {
    const files = await fs.readdir(generatedDir)
    for (const file of files) {
      if (!file.startsWith(prefix)) continue
      if (!file.match(/\.(png|jpg|jpeg)$/i)) continue

      const parsed = parseImageFilename(file)
      if (parsed.model !== model) continue

      // Extract variant name: tile_river_straight_ew_nb1_... → straight_ew
      const withoutPrefix = file.substring(prefix.length)
      const variantMatch = withoutPrefix.match(/^(.+?)_(?:nb1|nb2|nbpro|v\d+)/)
      if (variantMatch) {
        const variant = variantMatch[1]
        variants[variant] = `asset://${encodeURIComponent(path.join(generatedDir, file))}`
      }
    }
  } catch {}

  return variants
}

/**
 * Get the asset:// URL for the base grass tile for a given model.
 */
export async function getBaseTileImage(
  generatedDir: string,
  model: string
): Promise<string | null> {
  try {
    const files = await fs.readdir(generatedDir)
    for (const file of files) {
      if (!file.startsWith('tile_grass_')) continue
      if (!file.match(/\.(png|jpg|jpeg)$/i)) continue

      const parsed = parseImageFilename(file)
      if (parsed.model === model) {
        return `asset://${encodeURIComponent(path.join(generatedDir, file))}`
      }
    }
  } catch {}
  return null
}
