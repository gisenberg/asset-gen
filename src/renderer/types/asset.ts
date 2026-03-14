export interface AssetNode {
  id: string // relative path from assets/ without extension, e.g. "tiles/grass"
  name: string // display name from filename
  path: string // absolute filesystem path
  type: 'category' | 'asset' | 'mask' | 'descriptor'
  children?: AssetNode[]
  ancestors: string[] // ordered absolute paths to ancestor markdown files
}
