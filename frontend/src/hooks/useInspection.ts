import { useCallback, useEffect, useState } from 'react'
import { inspectionsApi } from '../lib/api/inspections'
import type { InspectionDto, InspectionItemResultDto } from '../types'

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

  /**
   * Patch a single item result in place (e.g. after saving a checklist
   * item) without refetching or re-showing the loading state — avoids
   * unmounting the whole checklist on every save.
   */
  const updateItemResult = useCallback((updated: InspectionItemResultDto) => {
    setInspection((prev) =>
      prev
        ? { ...prev, item_results: prev.item_results.map((r) => (r.id === updated.id ? updated : r)) }
        : prev,
    )
  }, [])

  /**
   * Apply a full inspection object returned by an action endpoint (submit,
   * approve) directly, no refetch.
   */
  const applyInspection = useCallback((data: InspectionDto) => {
    setInspection(data)
  }, [])

  return { inspection, isLoading, error, reload, updateItemResult, applyInspection }
}
