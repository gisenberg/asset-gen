import { useEffect, useState } from 'react'
import type { GenerationJob } from '../../types/generation'

interface GenerationStatusProps {
  job: GenerationJob
}

export function GenerationStatus({ job }: GenerationStatusProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (job.status !== 'generating') return

    const start = job.startedAt || Date.now()
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [job.status, job.startedAt])

  if (job.status === 'generating') {
    return (
      <div className="generation-status generating">
        <span className="spinner" />
        Generating with {job.model.displayName || job.model.shortName}... {elapsed}s
      </div>
    )
  }

  if (job.status === 'failed') {
    return (
      <div className="generation-status failed">
        Failed: {job.error}
      </div>
    )
  }

  if (job.status === 'completed') {
    const duration = job.completedAt && job.startedAt
      ? Math.floor((job.completedAt - job.startedAt) / 1000)
      : 0
    return (
      <div className="generation-status completed">
        Completed in {duration}s
      </div>
    )
  }

  return null
}
