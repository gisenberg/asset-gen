import fs from 'fs/promises'
import path from 'path'

export interface PromptResult {
  text: string
  maskPath: string | null
}

/**
 * Build a combined prompt for an asset by walking its ancestor chain.
 * Ports the Python generate_v2.py logic: game.md → category _*.md files → asset.md
 * Strips # Title lines from each file (matching Python behavior).
 * Also resolves the appropriate mask image if the asset is a tile.
 */
export async function buildPromptForAsset(assetsDir: string, assetId: string): Promise<PromptResult> {
  const parts: string[] = []

  // Collect ancestor paths by walking the directory hierarchy
  const assetPath = path.join(assetsDir, assetId + '.md')
  const segments = assetId.split('/')

  // Level 1: game.md
  const gameMd = path.join(assetsDir, 'game.md')
  const gameContent = await loadMd(gameMd)
  if (gameContent) parts.push(gameContent)

  // Walk intermediate directories for _*.md category descriptors
  let currentDir = assetsDir
  for (let i = 0; i < segments.length - 1; i++) {
    currentDir = path.join(currentDir, segments[i])
    const categoryFiles = await getCategoryFiles(currentDir)
    for (const cf of categoryFiles) {
      const content = await loadMd(cf)
      if (content) parts.push(content)
    }
  }

  // Asset-specific markdown
  const assetContent = await loadMd(assetPath)
  if (assetContent) parts.push(assetContent)

  const text = parts.join(' ')
  const maskPath = await resolveMask(assetsDir, assetId)
  return { text, maskPath }
}

/**
 * Resolve the mask image for a tile asset.
 * - Connectable variants (e.g. tiles/connectable/river/straight_ew) use
 *   their per-variant mask from assets/tiles/connectable/masks/{variant}.png
 * - Regular tiles (e.g. tiles/grass) use assets/tiles/tile_mask.png
 * - Props don't use masks.
 */
async function resolveMask(assetsDir: string, assetId: string): Promise<string | null> {
  if (!assetId.startsWith('tiles/')) return null

  // Connectable variant? Check for per-variant mask
  if (assetId.includes('connectable/')) {
    // tiles/connectable/river/straight_ew → variant name is "straight_ew"
    const leafName = assetId.split('/').pop()!
    const variantMask = path.join(assetsDir, 'tiles', 'connectable', 'masks', `${leafName}.png`)
    try {
      await fs.access(variantMask)
      return variantMask
    } catch {}
  }

  // Fall back to the base tile mask
  const baseMask = path.join(assetsDir, 'tiles', 'tile_mask.png')
  try {
    await fs.access(baseMask)
    return baseMask
  } catch {}

  return null
}

async function loadMd(filePath: string): Promise<string | null> {
  try {
    const text = await fs.readFile(filePath, 'utf-8')
    const lines = text.split('\n')
    // Strip leading title lines (# Foo) — matching Python behavior
    const contentLines = lines.filter((l) => !l.startsWith('# '))
    return contentLines.join('\n').trim() || null
  } catch {
    return null
  }
}

async function getCategoryFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir)
    return entries
      .filter((e) => e.startsWith('_') && e.endsWith('.md'))
      .sort()
      .map((e) => path.join(dir, e))
  } catch {
    return []
  }
}
