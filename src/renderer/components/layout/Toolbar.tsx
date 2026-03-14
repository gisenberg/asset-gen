import { MODELS } from '../../types/generation'
import { useGenerationStore } from '../../stores/generation-store'
import { useAssetStore } from '../../stores/asset-store'

function getConnectableType(assetId: string): string | null {
  const match = assetId.match(/^tiles\/connectable\/([^/]+)/)
  return match ? match[1] : null
}

export function Toolbar() {
  const { selectedModel, setModel, isGenerating, generate } = useGenerationStore()
  const selectedAsset = useAssetStore((s) => s.selectedAsset)

  const connectableType = selectedAsset ? getConnectableType(selectedAsset.id) : null
  const isLeafAsset = selectedAsset?.type === 'asset'

  const handleGenerate = () => {
    if (!selectedAsset || !isLeafAsset) return
    generate(selectedAsset.id)
  }

  const handleGenerateAll = () => {
    if (!selectedAsset || !isLeafAsset) return
    const { generateWithModel } = useGenerationStore.getState()
    for (const model of MODELS) {
      generateWithModel(selectedAsset.id, model)
    }
  }

  const handleGenerateAllVariants = async () => {
    if (!connectableType) return
    const variantIds = await window.electronAPI.getConnectableVariantIds(connectableType)
    const { generateWithModel } = useGenerationStore.getState()
    const model = useGenerationStore.getState().selectedModel
    for (const id of variantIds) {
      generateWithModel(id, model)
    }
  }

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <span className="toolbar-title">Asset Gen</span>
      </div>
      <div className="toolbar-right">
        <select
          className="model-selector"
          value={selectedModel.id}
          onChange={(e) => {
            const model = MODELS.find((m) => m.id === e.target.value)
            if (model) setModel(model)
          }}
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName} ({m.priceHint})
            </option>
          ))}
        </select>
        <button
          className="generate-btn"
          disabled={!isLeafAsset || isGenerating}
          onClick={handleGenerate}
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
        <button
          className="generate-all-btn"
          disabled={!isLeafAsset || isGenerating}
          onClick={handleGenerateAll}
          title="Generate with all 3 models"
        >
          All Models
        </button>
        {connectableType && (
          <button
            className="generate-all-btn"
            disabled={isGenerating}
            onClick={handleGenerateAllVariants}
            title={`Generate all ${connectableType} variants with selected model`}
          >
            All Variants
          </button>
        )}
      </div>
    </div>
  )
}
