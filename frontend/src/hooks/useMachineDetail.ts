import { useCallback, useEffect, useState } from 'react'
import { machinesApi } from '../lib/api/machines'
import type { InspectionSummaryDto, MachineDetail } from '../types'

export function useMachineDetail(machineId: number) {
  const [machine, setMachine] = useState<MachineDetail | null>(null)
  const [inspections, setInspections] = useState<InspectionSummaryDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setIsLoading(true)
    return Promise.all([machinesApi.get(machineId), machinesApi.inspections(machineId)])
      .then(([machineData, inspectionsData]) => {
        setMachine(machineData)
        setInspections(inspectionsData)
        setError(null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false))
  }, [machineId])

  useEffect(() => {
    reload()
  }, [reload])

  return { machine, inspections, isLoading, error, reload }
}
