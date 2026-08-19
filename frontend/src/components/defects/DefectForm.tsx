import { useRef, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { attachmentsApi } from '../../lib/api/attachments'
import { defectsApi } from '../../lib/api/defects'
import { HttpError } from '../../lib/http'
import type { DefectDto } from '../../types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const SEVERITIES: DefectDto['severity'][] = ['minor', 'major', 'critical']

type Props =
  | { mode: 'create'; inspectionItemResultId: number; defect?: undefined; onSaved: (defect: DefectDto) => void; onCancel?: () => void }
  | { mode: 'edit'; inspectionItemResultId?: undefined; defect: DefectDto; onSaved: (defect: DefectDto) => void; onCancel: () => void }

export function DefectForm({ mode, inspectionItemResultId, defect, onSaved, onCancel }: Props) {
  const [description, setDescription] = useState(defect?.description ?? '')
  const [severity, setSeverity] = useState<DefectDto['severity']>(defect?.severity ?? 'minor')
  const [replacementPhoto, setReplacementPhoto] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      if (mode === 'create') {
        const created = await defectsApi.create({
          inspection_item_result_id: inspectionItemResultId,
          description,
          severity,
        })
        onSaved(created)
        setDescription('')
      } else {
        const updated = await defectsApi.update(defect.id, { description, severity })
        let attachments = defect.attachments

        if (replacementPhoto) {
          await Promise.all(attachments.map((a) => attachmentsApi.delete(a.id)))
          const newAttachment = await defectsApi.uploadPhoto(defect.id, replacementPhoto)
          attachments = [newAttachment]
        }

        onSaved({ ...defect, ...updated, attachments })
      }
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Could not save defect.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-md border border-red-200 bg-red-50 p-3">
      <label className="text-xs font-medium text-red-800">{mode === 'edit' ? 'Edit defect' : 'Record defect'}</label>
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

      {mode === 'edit' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={(e) => setReplacementPhoto(e.target.files?.[0] ?? null)}
          />
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="bg-white">
            {replacementPhoto ? `Photo selected: ${replacementPhoto.name}` : 'Replace photo'}
          </Button>
          {defect.attachments.length > 0 && !replacementPhoto && (
            <p className="mt-1 text-xs text-muted-foreground">
              {defect.attachments.length} existing photo{defect.attachments.length > 1 ? 's' : ''} will be kept unless
              you select a new one.
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} className="h-11 flex-1 bg-red-600 hover:bg-red-700">
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Save defect'}
        </Button>
        {mode === 'edit' && (
          <Button type="button" variant="outline" onClick={onCancel} className="h-11 bg-white">
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
