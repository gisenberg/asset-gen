import { create } from 'zustand'
import type { GenerationJob, ModelInfo, MediaType } from '../types/generation'
import { MODELS } from '../types/generation'

interface GenerationState {
  selectedModel: ModelInfo
  jobs: GenerationJob[]
  isGenerating: boolean
  mediaType: MediaType

  setModel: (model: ModelInfo) => void
  addJob: (job: GenerationJob) => void
  updateJob: (job: GenerationJob) => void
  generate: (assetId: string) => Promise<void>
  generateWithModel: (assetId: string, model: ModelInfo) => Promise<void>
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  selectedModel: MODELS[0],
  jobs: [],
  isGenerating: false,
  mediaType: 'image',

  setModel: (model: ModelInfo) => set({ selectedModel: model }),

  addJob: (job: GenerationJob) =>
    set((state) => ({ jobs: [job, ...state.jobs] })),

  updateJob: (job: GenerationJob) =>
    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === job.id ? job : j)),
      isGenerating: job.status === 'generating'
    })),

  generate: async (assetId: string) => {
    const { selectedModel, generateWithModel } = get()
    return generateWithModel(assetId, selectedModel)
  },

  generateWithModel: async (assetId: string, model: ModelInfo) => {
    set({ isGenerating: true })

    try {
      const prompt = await window.electronAPI.buildPrompt(assetId)
      const prefix = assetId.startsWith('spritesheets/') ? 'sheet' : assetId.includes('tiles/') ? 'tile' : 'item'
      const nameParts = assetId.split('/').filter((p) => !['tiles', 'props', 'connectable', 'spritesheets'].includes(p))
      // MCP server appends its own timestamp + index suffix
      const filename = `${prefix}_${nameParts.join('_')}_${model.shortName}`

      const job = await window.electronAPI.generate(assetId, prompt, model.id, filename)
      set((state) => ({
        jobs: [job, ...state.jobs.filter((j) => j.id !== job.id)],
        isGenerating: false
      }))
    } catch (err: any) {
      set({ isGenerating: false })
    }
  }
}))
