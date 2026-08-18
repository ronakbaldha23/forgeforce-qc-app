import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChecklistItemCard } from '../components/checklist/ChecklistItemCard'
import { ProgressBar } from '../components/checklist/ProgressBar'
import { useInspection } from '../hooks/useInspection'
import { inspectionsApi } from '../lib/api/inspections'
import { HttpError } from '../lib/http'

export function InspectionPage() {
  const { inspectionId } = useParams()
  const id = Number(inspectionId)
  const { inspection, isLoading, error, reload } = useInspection(id)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (isLoading) return <p className="text-slate-500">Loading&hellip;</p>
  if (error || !inspection) return <p className="text-red-600">{error ?? 'Inspection not found.'}</p>

  const answered = inspection.item_results.filter((r) => r.result !== null).length
  const total = inspection.item_results.length
  const isDraft = inspection.status === 'draft'

  async function handleSubmit() {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await inspectionsApi.submit(id)
      await reload()
    } catch (err) {
      setSubmitError(err instanceof HttpError ? err.message : 'Could not submit inspection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <Link to={`/machines/${inspection.machine.id}`} className="text-sm text-slate-500">
        &larr; {inspection.machine.name}
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
          {inspection.machine.code} inspection
        </h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isDraft ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {isDraft ? 'In progress' : 'Submitted'}
        </span>
      </div>
      <p className="text-sm text-slate-500">
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
              onSaved={() => void reload()}
            />
          ))}
      </div>

      {isDraft && (
        <div className="mt-6">
          {submitError && <p className="mb-2 text-sm text-red-600">{submitError}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={answered < total || isSubmitting}
            className="min-h-[56px] w-full rounded-md bg-emerald-600 text-lg font-medium text-white disabled:opacity-40"
          >
            {isSubmitting ? 'Submitting…' : answered < total ? `Answer all items to submit (${answered}/${total})` : 'Submit inspection'}
          </button>
        </div>
      )}
    </div>
  )
}
