import fs from 'fs/promises'
import path from 'path'
import type { AssetNode } from '../renderer/types/asset'

export async function scanAssetsDir(assetsDir: string): Promise<AssetNode[]> {
  const rootAncestors: string[] = []

  // Check for game.md at root
  const gameMd = path.join(assetsDir, 'game.md')
  let hasGameMd = false
  try {
    await fs.access(gameMd)
    rootAncestors.push(gameMd)
    hasGameMd = true
  } catch {}

  const nodes: AssetNode[] = []

  // Add game.md as a descriptor at the root
  if (hasGameMd) {
    nodes.push({
      id: 'game',
      name: 'Game Art Direction',
      path: gameMd,
      type: 'descriptor',
      ancestors: []
    })
  }

  nodes.push(...await scanDirectory(assetsDir, assetsDir, rootAncestors))
  return nodes
}

async function scanDirectory(
  dir: string,
  assetsDir: string,
  ancestors: string[]
): Promise<AssetNode[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const nodes: AssetNode[] = []

  // Collect category descriptors for this level
  const localAncestors = [...ancestors]
  const descriptorFiles: string[] = []
  for (const entry of entries) {
    if (entry.isFile() && entry.name.startsWith('_') && entry.name.endsWith('.md')) {
      const fullPath = path.join(dir, entry.name)
      localAncestors.push(fullPath)
      descriptorFiles.push(entry.name)
    }
  }

  // Add descriptor nodes for _*.md files in this directory
  for (const name of descriptorFiles.sort()) {
    const fullPath = path.join(dir, name)
    const displayName = formatName(name.replace(/^_/, '').replace(/\.md$/, ''))
    const relativePath = path.relative(assetsDir, fullPath).replace(/\.md$/, '')
    nodes.push({
      id: relativePath,
      name: displayName,
      path: fullPath,
      type: 'descriptor',
      ancestors: ancestors // ancestors before this descriptor
    })
  }

  // Sort entries for consistent ordering
  const sorted = entries.sort((a, b) => {
    // Directories first, then files
    if (a.isDirectory() && !b.isDirectory()) return -1
    if (!a.isDirectory() && b.isDirectory()) return 1
    return a.name.localeCompare(b.name)
  })

  for (const entry of sorted) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      const children = await scanDirectory(fullPath, assetsDir, localAncestors)
      if (children.length > 0) {
        const relativePath = path.relative(assetsDir, fullPath)
        nodes.push({
          id: relativePath,
          name: formatName(entry.name),
          path: fullPath,
          type: 'category',
          children,
          ancestors: localAncestors
        })
      }
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.md') &&
      !entry.name.startsWith('_') &&
      entry.name !== 'game.md'
    ) {
      const relativePath = path.relative(assetsDir, fullPath).replace(/\.md$/, '')
      nodes.push({
        id: relativePath,
        name: formatName(entry.name.replace(/\.md$/, '')),
        path: fullPath,
        type: 'asset',
        ancestors: localAncestors
      })
    } else if (
      entry.isFile() &&
      /\.(png|jpg|jpeg)$/i.test(entry.name)
    ) {
      const relativePath = path.relative(assetsDir, fullPath).replace(/\.\w+$/, '')
      nodes.push({
        id: relativePath,
        name: formatName(entry.name.replace(/\.\w+$/, '')),
        path: fullPath,
        type: 'mask',
        ancestors: localAncestors
      })
    }
  }

  return nodes
}

function formatName(filename: string): string {
  return filename
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
