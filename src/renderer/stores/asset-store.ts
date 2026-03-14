import { create } from 'zustand'
import type { AssetNode } from '../types/asset'

interface AssetState {
  tree: AssetNode[]
  selectedAssetId: string | null
  selectedAsset: AssetNode | null
  expandedIds: Set<string>
  loading: boolean

  loadTree: () => Promise<void>
  selectAsset: (node: AssetNode) => void
  toggleExpand: (id: string) => void
}

export const useAssetStore = create<AssetState>((set, get) => ({
  tree: [],
  selectedAssetId: null,
  selectedAsset: null,
  expandedIds: new Set<string>(),
  loading: false,

  loadTree: async () => {
    set({ loading: true })
    try {
      const tree = await window.electronAPI.scanAssets()
      set({ tree, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  selectAsset: (node: AssetNode) => {
    if (node.type !== 'category') {
      set({ selectedAssetId: node.id, selectedAsset: node })
    }
  },

  toggleExpand: (id: string) => {
    const expanded = new Set(get().expandedIds)
    if (expanded.has(id)) {
      expanded.delete(id)
    } else {
      expanded.add(id)
    }
    set({ expandedIds: expanded })
  }
}))
