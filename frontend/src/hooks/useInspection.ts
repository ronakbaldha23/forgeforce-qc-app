import { useCallback, useEffect, useState } from 'react'
import { inspectionsApi } from '../lib/api/inspections'
import type { InspectionDto } from '../types'

export function useInspection(inspectionId: number) {
  const [inspection, setInspection] = useState<InspectionDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setIsLoading(true)
    return inspectionsApi
      .get(inspectionId)
      .then((data) => {
        setInspection(data)
        setError(null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false))
  }, [inspectionId])

  useEffect(() => {
    reload()
  }, [reload])

  return { inspection, isLoading, error, reload }
}
