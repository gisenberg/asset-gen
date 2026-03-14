import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { useAssetStore } from '../../stores/asset-store'
import { AncestorSection } from './AncestorSection'
import { AssetEditor } from './AssetEditor'
import './EditorPane.css'

export function EditorPane() {
  const selectedAsset = useAssetStore((s) => s.selectedAsset)
  const [ancestorContents, setAncestorContents] = useState<{ path: string; content: string }[]>([])
  const [assetContent, setAssetContent] = useState('')

  useEffect(() => {
    if (!selectedAsset) return

    // Load ancestor contents
    Promise.all(
      selectedAsset.ancestors.map(async (p) => {
        const content = await window.electronAPI.readFile(p)
        return { path: p, content }
      })
    ).then(setAncestorContents)

    // Load asset content
    window.electronAPI.readFile(selectedAsset.path).then(setAssetContent)
  }, [selectedAsset])

  // Listen for file change events to reload content (asset + ancestors)
  useEffect(() => {
    if (!selectedAsset) return
    const unsub = window.electronAPI.onFileChanged((filePath) => {
      if (filePath === selectedAsset.path) {
        window.electronAPI.readFile(selectedAsset.path).then(setAssetContent)
      }
      if (selectedAsset.ancestors.includes(filePath)) {
        // Reload the changed ancestor
        window.electronAPI.readFile(filePath).then((content) => {
          setAncestorContents((prev) =>
            prev.map((a) => (a.path === filePath ? { ...a, content } : a))
          )
        })
      }
    })
    return unsub
  }, [selectedAsset])

  if (!selectedAsset) {
    return <div className="pane-placeholder">Select an asset to edit</div>
  }

  if (selectedAsset.type === 'descriptor') {
    return (
      <div className="editor-pane">
        <div className="editor-scroll">
          {ancestorContents.map(({ path, content }) => (
            <AncestorSection key={path} filePath={path} content={content} />
          ))}
          <AssetEditor
            asset={selectedAsset}
            content={assetContent}
            onChange={setAssetContent}
          />
        </div>
      </div>
    )
  }

  if (selectedAsset.type === 'mask') {
    return (
      <div className="editor-pane">
        <div className="editor-scroll">
          <div className="mask-preview">
            <div className="editor-header">
              <span className="editor-filename">{selectedAsset.name}</span>
              <span className="mask-badge">Mask</span>
            </div>
            <img
              src={`asset://${encodeURIComponent(selectedAsset.path)}`}
              alt={selectedAsset.name}
              className="mask-image"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="editor-pane">
      <div className="editor-scroll">
        {ancestorContents.map(({ path, content }) => (
          <AncestorSection key={path} filePath={path} content={content} />
        ))}
        <AssetEditor
          asset={selectedAsset}
          content={assetContent}
          onChange={setAssetContent}
        />
      </div>
    </div>
  )
}
