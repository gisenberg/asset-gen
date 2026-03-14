import { MODELS } from '../../types/generation'
import { useGenerationStore } from '../../stores/generation-store'
import { useAssetStore } from '../../stores/asset-store'

export function Toolbar() {
  const { selectedModel, setModel, isGenerating, generate } = useGenerationStore()
  const selectedAsset = useAssetStore((s) => s.selectedAsset)

  const handleGenerate = () => {
    if (!selectedAsset) return
    generate(selectedAsset.id, selectedAsset.ancestors)
  }

  const handleGenerateAll = () => {
    if (!selectedAsset) return
    const { generateWithModel } = useGenerationStore.getState()
    // Fire all three concurrently
    for (const model of MODELS) {
      generateWithModel(selectedAsset.id, model)
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
          disabled={!selectedAsset || isGenerating}
          onClick={handleGenerate}
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
        <button
          className="generate-all-btn"
          disabled={!selectedAsset || isGenerating}
          onClick={handleGenerateAll}
          title="Generate with all 3 models"
        >
          Generate All
        </button>
      </div>
    </div>
  )
}
