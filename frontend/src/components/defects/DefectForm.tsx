import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { defectsApi } from '../../lib/api/defects'
import { HttpError } from '../../lib/http'
import type { DefectDto } from '../../types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

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
      <Textarea
        required
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the defect"
        className="min-h-16 bg-white"
      />
      <div className="flex gap-2">
        {SEVERITIES.map((s) => (
          <Button
            key={s}
            type="button"
            variant="outline"
            onClick={() => setSeverity(s)}
            className={cn(
              'h-11 flex-1 capitalize',
              severity === s ? 'border-red-600 bg-red-600 text-white hover:bg-red-600 hover:text-white' : '',
            )}
          >
            {s}
          </Button>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isSubmitting} className="h-11 bg-red-600 hover:bg-red-700">
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? 'Saving…' : 'Save defect'}
      </Button>
    </form>
  )
}
