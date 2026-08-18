import { useEffect, useState, type FormEvent } from 'react'
import { correctiveActionsApi } from '../../lib/api/correctiveActions'
import { usersApi } from '../../lib/api/users'
import { HttpError } from '../../lib/http'
import type { CorrectiveActionDto, User } from '../../types'

export function CorrectiveActionForm({
  defectId,
  onCreated,
  onCancel,
}: {
  defectId: number
  onCreated: (action: CorrectiveActionDto) => void
  onCancel: () => void
}) {
  const [users, setUsers] = useState<User[]>([])
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    usersApi.list().then(setUsers).catch(() => setUsers([]))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const action = await correctiveActionsApi.create({
        defect_id: defectId,
        description,
        assigned_to: assignedTo ? Number(assignedTo) : null,
        due_date: dueDate || null,
      })
      onCreated(action)
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Could not save corrective action.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 rounded-md border border-slate-200 p-3">
      <label className="text-xs font-medium text-slate-600">Corrective action</label>
      <textarea
        required
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What needs to be done to fix this?"
        className="min-h-[64px] rounded-md border border-slate-300 p-2 text-sm"
      />
      <div className="flex gap-2">
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="min-h-[44px] flex-1 rounded-md border border-slate-300 px-2 text-sm"
        >
          <option value="">Assign to&hellip;</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="min-h-[44px] rounded-md border border-slate-300 px-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-[44px] flex-1 rounded-md bg-slate-900 text-sm font-medium text-white disabled:opacity-50"
        >
          Save corrective action
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] rounded-md border border-slate-300 px-4 text-sm text-slate-600"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
