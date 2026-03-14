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

  // For connectable variants, inject seamlessness instructions
  if (assetId.includes('connectable/')) {
    const leafName = assetId.split('/').pop()!
    parts.push(buildSeamlessnessInstructions(leafName))
  }

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

// Edge connection info for each variant
const VARIANT_EDGES: Record<string, string[]> = {
  straight_ew: ['E', 'W'],
  straight_ns: ['N', 'S'],
  corner_ne: ['N', 'E'],
  corner_nw: ['N', 'W'],
  corner_se: ['S', 'E'],
  corner_sw: ['S', 'W'],
  tjunction_nes: ['N', 'E', 'S'],
  tjunction_new: ['N', 'E', 'W'],
  tjunction_nsw: ['N', 'S', 'W'],
  tjunction_esw: ['E', 'S', 'W'],
  crossroads: ['N', 'E', 'S', 'W'],
  end_n: ['N'],
  end_e: ['E'],
  end_s: ['S'],
  end_w: ['W'],
}

const EDGE_NAMES: Record<string, string> = {
  N: 'top-right',
  E: 'bottom-right',
  S: 'bottom-left',
  W: 'top-left',
}

function buildSeamlessnessInstructions(variantName: string): string {
  const edges = VARIANT_EDGES[variantName]
  if (!edges) return ''

  const connectedEdges = edges.map((e) => `${e} (${EDGE_NAMES[e]})`).join(', ')
  const allEdgeNames = ['N', 'E', 'S', 'W']
  const disconnectedEdges = allEdgeNames
    .filter((e) => !edges.includes(e))
    .map((e) => `${e} (${EDGE_NAMES[e]})`)
    .join(', ')

  const lines = [
    '## Seamless Tiling Instructions',
    `This tile connects on edges: ${connectedEdges}.`,
  ]

  if (disconnectedEdges) {
    lines.push(
      `Edges ${disconnectedEdges} have NO feature — they must be pure ground terrain that seamlessly matches an adjacent plain grass tile.`
    )
  }

  lines.push(
    'CRITICAL for seamless tiling:',
    '- The ground (green mask region) must use IDENTICAL color, texture, and value as a plain grass base tile — same hue, same brightness, same brushstroke density.',
    '- At every edge boundary, the ground texture must be continuous — no visible seam, no color shift, no abrupt texture change.',
    '- The feature (blue mask region) must cross connected edges at EXACTLY the center 40% of each edge. The crossing width and position must be identical on every connected edge so tiles align when placed adjacent.',
    '- Where the feature meets a disconnected edge\'s ground, it must taper and blend into the grass naturally — no hard cutoffs.',
    '- Bank/shore transitions between feature and ground should be soft, natural gradients — not hard lines.'
  )

  return lines.join('\n')
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
