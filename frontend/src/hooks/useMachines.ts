import { useEffect, useState } from 'react'
import { machinesApi } from '../lib/api/machines'
import type { Machine } from '../types'

export function useMachines() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    machinesApi
      .list()
      .then(setMachines)
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false))
  }, [])

  return { machines, isLoading, error }
}
