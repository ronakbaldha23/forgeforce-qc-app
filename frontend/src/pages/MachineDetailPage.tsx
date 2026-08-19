import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useMachineDetail } from '../hooks/useMachineDetail'
import { inspectionsApi } from '../lib/api/inspections'
import { HttpError } from '../lib/http'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading&hellip;
      </p>
    )
  }
  if (error || !machine) return <p className="text-destructive">{error ?? 'Machine not found.'}</p>

  return (
    <div>
      <Link to="/" className="cursor-pointer text-sm text-muted-foreground hover:underline">
        &larr; Machines
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-foreground">{machine.name}</h1>
      <p className="text-sm text-muted-foreground">
        {machine.code} &middot; Serial {machine.serial_number} &middot; {machine.machine_type.name}
        {machine.location ? ` · ${machine.location}` : ''}
      </p>

      <div className="mt-6">
        {machine.draft_inspection ? (
          <Button asChild className="h-14 w-full bg-amber-500 text-base text-white hover:bg-amber-600">
            <Link to={`/inspections/${machine.draft_inspection.id}`}>Continue in-progress inspection</Link>
          </Button>
        ) : (
          <Button type="button" onClick={handleStart} disabled={isStarting} className="h-14 w-full text-base">
            {isStarting && <Loader2 className="animate-spin" />}
            {isStarting ? 'Starting…' : 'Start new inspection'}
          </Button>
        )}
        {startError && <p className="mt-2 text-sm text-destructive">{startError}</p>}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-foreground">Inspection history</h2>
      {inspections.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No inspections recorded yet.</p>}
      <div className="mt-3 flex flex-col gap-2">
        {inspections.map((inspection) => (
          <Link key={inspection.id} to={`/inspections/${inspection.id}`} className="cursor-pointer">
            <Card className="flex-row items-center justify-between px-4 py-3 shadow-sm transition-colors hover:bg-muted/50 active:bg-muted">
              <div>
                <p className="font-medium text-foreground">
                  {new Date(inspection.started_at).toLocaleDateString()} &middot; {inspection.inspector}
                </p>
                <p className="text-sm text-muted-foreground">
                  {inspection.fail_count > 0 && `${inspection.fail_count} failed item(s)`}
                  {inspection.defect_count > 0 && ` · ${inspection.defect_count} defect(s)`}
                </p>
              </div>
              <Badge variant={inspection.status === 'draft' ? 'secondary' : 'default'}>
                {STATUS_LABEL[inspection.status] ?? inspection.status}
              </Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
