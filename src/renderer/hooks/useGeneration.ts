import { useEffect } from 'react'
import { useGenerationStore } from '../stores/generation-store'

export function useGeneration() {
  const store = useGenerationStore()

  useEffect(() => {
    const unsub = window.electronAPI.onGenerationUpdate((job) => {
      store.updateJob(job)
    })
    return unsub
  }, [])

  return store
}
