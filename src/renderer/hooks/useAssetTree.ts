import { useEffect } from 'react'
import { useAssetStore } from '../stores/asset-store'

export function useAssetTree() {
  const { tree, loadTree, selectedAsset, selectAsset, toggleExpand, expandedIds, loading } =
    useAssetStore()

  useEffect(() => {
    loadTree()
  }, [loadTree])

  return { tree, selectedAsset, selectAsset, toggleExpand, expandedIds, loading }
}
