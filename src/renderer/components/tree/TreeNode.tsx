import type { AssetNode } from '../../types/asset'
import { useAssetStore } from '../../stores/asset-store'

interface TreeNodeProps {
  node: AssetNode
  depth: number
}

export function TreeNode({ node, depth }: TreeNodeProps) {
  const { selectedAssetId, selectAsset, toggleExpand, expandedIds } = useAssetStore()
  const isExpanded = expandedIds.has(node.id)
  const isSelected = node.id === selectedAssetId
  const isCategory = node.type === 'category'

  const handleClick = () => {
    if (isCategory) {
      toggleExpand(node.id)
    } else {
      selectAsset(node)
    }
  }

  const iconMap = { category: isExpanded ? '▼' : '▶', asset: '◆', mask: '▧', descriptor: '▤' }
  const icon = iconMap[node.type]
  const nodeClass = node.type

  return (
    <>
      <div
        className={`tree-node ${isSelected ? 'selected' : ''} ${nodeClass}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={handleClick}
      >
        <span className="tree-icon">
          {icon}
        </span>
        <span className="tree-label">{node.name}</span>
      </div>
      {isCategory && isExpanded && node.children?.map((child) => (
        <TreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  )
}
