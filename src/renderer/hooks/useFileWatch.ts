import { useEffect } from 'react'
import { useAssetStore } from '../stores/asset-store'

export function useFileWatch() {
  const loadTree = useAssetStore((s) => s.loadTree)
  const selectedAsset = useAssetStore((s) => s.selectedAsset)

  useEffect(() => {
    const unsubTree = window.electronAPI.onTreeChanged(() => {
      loadTree()
    })

    const unsubFile = window.electronAPI.onFileChanged((_filePath) => {
      // If the changed file is currently selected, the editor component
      // will handle reloading via its own effect
    })

    const unsubImages = window.electronAPI.onImagesChanged((_assetId) => {
      // Preview pane will re-fetch images when this event fires
      // Trigger a re-render by dispatching a custom event
      window.dispatchEvent(new CustomEvent('images-changed'))
    })

    return () => {
      unsubTree()
      unsubFile()
      unsubImages()
    }
  }, [loadTree, selectedAsset])
}
