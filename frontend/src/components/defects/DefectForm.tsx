import { useState, type FormEvent } from 'react'
import { defectsApi } from '../../lib/api/defects'
import { HttpError } from '../../lib/http'
import type { DefectDto } from '../../types'

const SEVERITIES: DefectDto['severity'][] = ['minor', 'major', 'critical']

export function DefectForm({
  inspectionItemResultId,
  onCreated,
}: {
  inspectionItemResultId: number
  onCreated: (defect: DefectDto) => void
}) {
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<DefectDto['severity']>('minor')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const defect = await defectsApi.create({
        inspection_item_result_id: inspectionItemResultId,
        description,
        severity,
      })
      onCreated(defect)
      setDescription('')
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Could not save defect.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-md border border-red-200 bg-red-50 p-3">
      <label className="text-xs font-medium text-red-800">Record defect</label>
      <textarea
        required
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the defect"
        className="min-h-[64px] rounded-md border border-slate-300 p-2 text-sm"
      />
      <div className="flex gap-2">
        {SEVERITIES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSeverity(s)}
            className={`min-h-[44px] flex-1 rounded-md border text-sm font-medium capitalize ${
              severity === s ? 'border-red-600 bg-red-600 text-white' : 'border-slate-300 text-slate-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-[44px] rounded-md bg-red-600 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? 'Saving…' : 'Save defect'}
      </button>
    </form>
  )
}
