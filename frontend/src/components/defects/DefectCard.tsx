import { useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { CorrectiveActionCard } from '../corrective-actions/CorrectiveActionCard'
import { CorrectiveActionForm } from '../corrective-actions/CorrectiveActionForm'
import type { DefectDto } from '../../types'
import { PhotoUpload } from './PhotoUpload'
import { DefectForm } from './DefectForm'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const SEVERITY_VARIANT: Record<DefectDto['severity'], 'secondary' | 'default' | 'destructive'> = {
  minor: 'secondary',
  major: 'default',
  critical: 'destructive',
}

export function DefectCard({
  defect: initial,
  onChanged,
}: {
  defect: DefectDto
  onChanged: (defect: DefectDto) => void
}) {
  const [defect, setDefect] = useState(initial)
  const [showActionForm, setShowActionForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  function update(next: DefectDto) {
    setDefect(next)
    onChanged(next)
  }

  if (isEditing) {
    return (
      <DefectForm
        mode="edit"
        defect={defect}
        onCancel={() => setIsEditing(false)}
        onSaved={(updated) => {
          update(updated)
          setIsEditing(false)
          setJustSaved(true)
          setTimeout(() => setJustSaved(false), 2000)
        }}
      />
    )
  }

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-foreground">{defect.description}</p>
        <div className="flex shrink-0 items-center gap-1">
          {justSaved && <span className="text-xs text-emerald-600">&#10003; Saved</span>}
          <Badge variant={SEVERITY_VARIANT[defect.severity]} className="capitalize">
            {defect.severity}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Edit defect"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="size-3.5" />
          </Button>
        </div>
      </div>

      {defect.attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {defect.attachments.map((a) => (
            <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="cursor-pointer">
              <img src={a.url} alt={a.original_filename} className="h-16 w-16 rounded object-cover" />
            </a>
          ))}
        </div>
      )}

      {defect.attachments.length === 0 && (
        <div className="mt-2">
          <PhotoUpload
            defectId={defect.id}
            onUploaded={(attachment) => update({ ...defect, attachments: [...defect.attachments, attachment] })}
          />
        </div>
      )}

      <div className="mt-3">
        <p className="text-xs font-medium text-muted-foreground">Corrective action</p>
        {defect.corrective_actions.map((action) => (
          <CorrectiveActionCard
            key={action.id}
            action={action}
            onChanged={(updated) =>
              update({
                ...defect,
                corrective_actions: defect.corrective_actions.map((a) => (a.id === updated.id ? updated : a)),
              })
            }
          />
        ))}
        {!showActionForm && (
          <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => setShowActionForm(true)}>
            <Plus className="size-3.5" /> Add corrective action
          </Button>
        )}
        {showActionForm && (
          <CorrectiveActionForm
            mode="create"
            defectId={defect.id}
            onSaved={(action) => {
              update({ ...defect, corrective_actions: [...defect.corrective_actions, action] })
              setShowActionForm(false)
            }}
            onCancel={() => setShowActionForm(false)}
          />
        )}
      </div>
    </div>
  )
}
