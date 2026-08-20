import { useState } from 'react'
import { Pencil } from 'lucide-react'
import type { CorrectiveActionDto } from '../../types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CorrectiveActionForm } from './CorrectiveActionForm'

const STATUS_VARIANT: Record<CorrectiveActionDto['status'], 'secondary' | 'default' | 'destructive'> = {
  pending: 'secondary',
  in_progress: 'default',
  completed: 'default',
  verified: 'default',
}

export function CorrectiveActionCard({
  action: initial,
  onChanged,
}: {
  action: CorrectiveActionDto
  onChanged: (action: CorrectiveActionDto) => void
}) {
  const [action, setAction] = useState(initial)
  const [isEditing, setIsEditing] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  function handleSaved(updated: CorrectiveActionDto) {
    setAction(updated)
    onChanged(updated)
    setIsEditing(false)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
  }

  if (isEditing) {
    return (
      <CorrectiveActionForm
        mode="edit"
        action={action}
        onSaved={handleSaved}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  return (
    <div className="mt-1 rounded-md bg-muted p-2 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p>{action.description}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          aria-label="Edit corrective action"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="size-3.5" />
        </Button>
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {action.assigned_to ? `Assigned to ${action.assigned_to.name}` : 'Unassigned'}
        {action.due_date && ` · Due ${action.due_date}`}
        <Badge variant={STATUS_VARIANT[action.status]} className="capitalize">
          {action.status.replace('_', ' ')}
        </Badge>
        {justSaved && <span className="text-emerald-600">&#10003; Saved</span>}
      </p>
      {action.completion_notes && <p className="mt-1 text-xs text-muted-foreground italic">{action.completion_notes}</p>}
    </div>
  )
}
