import { useAssetTree } from '../../hooks/useAssetTree'
import { TreeNode } from './TreeNode'
import './AssetTree.css'

export function AssetTree() {
  const { tree, loading } = useAssetTree()

  if (loading) {
    return <div className="pane-placeholder">Loading assets...</div>
  }

  if (tree.length === 0) {
    return <div className="pane-placeholder">No assets found in assets/</div>
  }

  return (
    <div className="asset-tree">
      <div className="tree-header">Assets</div>
      <div className="tree-list">
        {tree.map((node) => (
          <TreeNode key={node.id} node={node} depth={0} />
        ))}
      </div>
    </div>
  )
}
