import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMachineDetail } from '../hooks/useMachineDetail'
import { inspectionsApi } from '../lib/api/inspections'
import { HttpError } from '../lib/http'

const STATUS_LABEL: Record<string, string> = { draft: 'In progress', submitted: 'Submitted' }

export function MachineDetailPage() {
  const { machineId } = useParams()
  const id = Number(machineId)
  const { machine, inspections, isLoading, error } = useMachineDetail(id)
  const navigate = useNavigate()
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  async function handleStart() {
    setIsStarting(true)
    setStartError(null)
    try {
      const inspection = await inspectionsApi.start(id)
      navigate(`/inspections/${inspection.id}`)
    } catch (err) {
      setStartError(err instanceof HttpError ? err.message : 'Could not start inspection.')
    } finally {
      setIsStarting(false)
    }
  }

  if (isLoading) return <p className="text-slate-500">Loading&hellip;</p>
  if (error || !machine) return <p className="text-red-600">{error ?? 'Machine not found.'}</p>

  return (
    <div>
      <Link to="/" className="text-sm text-slate-500">
        &larr; Machines
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-slate-900">{machine.name}</h1>
      <p className="text-sm text-slate-500">
        {machine.code} &middot; Serial {machine.serial_number} &middot; {machine.machine_type.name}
        {machine.location ? ` · ${machine.location}` : ''}
      </p>

      <div className="mt-6">
        {machine.draft_inspection ? (
          <Link
            to={`/inspections/${machine.draft_inspection.id}`}
            className="flex min-h-[56px] w-full items-center justify-center rounded-md bg-amber-500 text-lg font-medium text-white active:bg-amber-600"
          >
            Continue in-progress inspection
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleStart}
            disabled={isStarting}
            className="min-h-[56px] w-full rounded-md bg-slate-900 text-lg font-medium text-white disabled:opacity-50"
          >
            {isStarting ? 'Starting…' : 'Start new inspection'}
          </button>
        )}
        {startError && <p className="mt-2 text-sm text-red-600">{startError}</p>}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Inspection history</h2>
      {inspections.length === 0 && <p className="mt-2 text-sm text-slate-500">No inspections recorded yet.</p>}
      <div className="mt-3 flex flex-col gap-2">
        {inspections.map((inspection) => (
          <Link
            key={inspection.id}
            to={`/inspections/${inspection.id}`}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm active:bg-slate-50"
          >
            <div>
              <p className="font-medium text-slate-900">
                {new Date(inspection.started_at).toLocaleDateString()} &middot; {inspection.inspector}
              </p>
              <p className="text-sm text-slate-500">
                {STATUS_LABEL[inspection.status] ?? inspection.status}
                {inspection.fail_count > 0 && ` · ${inspection.fail_count} failed item(s)`}
                {inspection.defect_count > 0 && ` · ${inspection.defect_count} defect(s)`}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
