import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AiSummaryPanel } from '../components/ai/AiSummaryPanel'
import { ChecklistItemCard } from '../components/checklist/ChecklistItemCard'
import { ProgressBar } from '../components/checklist/ProgressBar'
import { useInspection } from '../hooks/useInspection'
import { inspectionsApi } from '../lib/api/inspections'
import { HttpError } from '../lib/http'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function InspectionPage() {
  const { inspectionId } = useParams()
  const id = Number(inspectionId)
  const { inspection, isLoading, error, updateItemResult, applySubmission } = useInspection(id)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading&hellip;
      </p>
    )
  }
  if (error || !inspection) return <p className="text-destructive">{error ?? 'Inspection not found.'}</p>

  const answered = inspection.item_results.filter((r) => r.result !== null).length
  const total = inspection.item_results.length
  const isDraft = inspection.status === 'draft'
  const hasFailedItems = inspection.item_results.some((r) => r.result === 'fail')

  async function handleSubmit() {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const submitted = await inspectionsApi.submit(id)
      applySubmission(submitted)
    } catch (err) {
      setSubmitError(err instanceof HttpError ? err.message : 'Could not submit inspection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <Link to={`/machines/${inspection.machine.id}`} className="cursor-pointer text-sm text-muted-foreground hover:underline">
        &larr; {inspection.machine.name}
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-foreground">{inspection.machine.code} inspection</h1>
        <Badge
          className={cn(isDraft ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}
        >
          {isDraft ? 'In progress' : 'Submitted'}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Inspector: {inspection.inspector} &middot; Started {new Date(inspection.started_at).toLocaleString()}
        {inspection.submitted_at && ` · Submitted ${new Date(inspection.submitted_at).toLocaleString()}`}
      </p>

      <div className="mt-4">
        <ProgressBar answered={answered} total={total} />
      </div>

      {!isDraft && (
        <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          This inspection has been submitted. Changing a result now requires a reason and is permanently recorded
          in that item's history.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {inspection.item_results
          .slice()
          .sort((a, b) => a.template_item.sort_order - b.template_item.sort_order)
          .map((item) => (
            <ChecklistItemCard
              key={item.id}
              item={item}
              inspectionStatus={inspection.status}
              onSaved={updateItemResult}
            />
          ))}
      </div>

      {isDraft && (
        <div className="mt-6">
          {submitError && <p className="mb-2 text-sm text-destructive">{submitError}</p>}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={answered < total || isSubmitting}
            className="h-14 w-full bg-emerald-600 text-base hover:bg-emerald-700"
          >
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isSubmitting
              ? 'Submitting…'
              : answered < total
                ? `Answer all items to submit (${answered}/${total})`
                : 'Submit inspection'}
          </Button>
        </div>
      )}

      {hasFailedItems && <AiSummaryPanel inspectionId={inspection.id} />}
    </div>
  )
}
