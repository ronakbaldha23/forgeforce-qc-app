import { useEffect, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { correctiveActionsApi } from '../../lib/api/correctiveActions'
import { usersApi } from '../../lib/api/users'
import { HttpError } from '../../lib/http'
import type { CorrectiveActionDto, User } from '../../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const STATUSES: CorrectiveActionDto['status'][] = ['pending', 'in_progress', 'completed', 'verified']

type Props =
  | { mode: 'create'; defectId: number; action?: undefined; onSaved: (action: CorrectiveActionDto) => void; onCancel: () => void }
  | { mode: 'edit'; defectId?: undefined; action: CorrectiveActionDto; onSaved: (action: CorrectiveActionDto) => void; onCancel: () => void }

export function CorrectiveActionForm({ mode, defectId, action, onSaved, onCancel }: Props) {
  const [users, setUsers] = useState<User[]>([])
  const [description, setDescription] = useState(action?.description ?? '')
  const [assignedTo, setAssignedTo] = useState(action?.assigned_to ? String(action.assigned_to.id) : '')
  const [dueDate, setDueDate] = useState(action?.due_date ?? '')
  const [status, setStatus] = useState<CorrectiveActionDto['status']>(action?.status ?? 'pending')
  const [completionNotes, setCompletionNotes] = useState(action?.completion_notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const needsCompletionNotes = mode === 'edit' && (status === 'completed' || status === 'verified')

  useEffect(() => {
    usersApi.list().then(setUsers).catch(() => setUsers([]))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const saved =
        mode === 'create'
          ? await correctiveActionsApi.create({
              defect_id: defectId,
              description,
              assigned_to: assignedTo ? Number(assignedTo) : null,
              due_date: dueDate || null,
            })
          : await correctiveActionsApi.update(action.id, {
              description,
              assigned_to: assignedTo ? Number(assignedTo) : null,
              due_date: dueDate || null,
              status,
              completion_notes: completionNotes || null,
            })
      onSaved(saved)
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Could not save corrective action.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 rounded-md border p-3">
      <label className="text-xs font-medium text-muted-foreground">Corrective action</label>
      <Textarea
        required
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What needs to be done to fix this?"
        className="min-h-16 bg-background"
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="h-11 flex-1 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Assign to&hellip;</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-11 sm:w-auto" />
      </div>

      {mode === 'edit' && (
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as CorrectiveActionDto['status'])}
          className="h-11 w-full cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm capitalize outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
      )}

      {needsCompletionNotes && (
        <Textarea
          required
          value={completionNotes}
          onChange={(e) => setCompletionNotes(e.target.value)}
          placeholder="Completion notes (required when marking completed/verified)"
          className="min-h-14 bg-background"
        />
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} className="h-11 flex-1">
          {isSubmitting && <Loader2 className="animate-spin" />}
          Save corrective action
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="h-11">
          Cancel
        </Button>
      </div>
    </form>
  )
}
