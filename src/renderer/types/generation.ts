export type ModelId =
  | 'google/gemini-2.5-flash-image'
  | 'google/gemini-3.1-flash-image-preview'
  | 'google/gemini-3-pro-image-preview'

export type ModelShortName = 'nb1' | 'nb2' | 'nbpro'

export interface ModelInfo {
  id: ModelId
  shortName: ModelShortName
  displayName: string
  priceHint: string
}

export const MODELS: ModelInfo[] = [
  {
    id: 'google/gemini-2.5-flash-image',
    shortName: 'nb1',
    displayName: 'Nano Banana',
    priceHint: '~$0.039/image'
  },
  {
    id: 'google/gemini-3.1-flash-image-preview',
    shortName: 'nb2',
    displayName: 'Nano Banana 2',
    priceHint: '~$0.067/image'
  },
  {
    id: 'google/gemini-3-pro-image-preview',
    shortName: 'nbpro',
    displayName: 'Nano Banana Pro',
    priceHint: '~$0.134/image'
  }
]

export type MediaType = 'image' | 'audio'

export type JobStatus = 'queued' | 'generating' | 'completed' | 'failed'

export interface GenerationJob {
  id: string
  assetId: string
  model: ModelInfo
  mediaType: MediaType
  status: JobStatus
  startedAt?: number
  completedAt?: number
  error?: string
  resultPath?: string
}
