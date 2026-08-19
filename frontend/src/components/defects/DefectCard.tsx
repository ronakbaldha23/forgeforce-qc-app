import { useState } from 'react'
import { CorrectiveActionForm } from '../corrective-actions/CorrectiveActionForm'
import type { DefectDto } from '../../types'
import { PhotoUpload } from './PhotoUpload'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const SEVERITY_VARIANT: Record<DefectDto['severity'], 'secondary' | 'default' | 'destructive'> = {
  minor: 'secondary',
  major: 'default',
  critical: 'destructive',
}

export function DefectCard({ defect: initial }: { defect: DefectDto }) {
  const [defect, setDefect] = useState(initial)
  const [showActionForm, setShowActionForm] = useState(false)

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-foreground">{defect.description}</p>
        <Badge variant={SEVERITY_VARIANT[defect.severity]} className="shrink-0 capitalize">
          {defect.severity}
        </Badge>
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

      <div className="mt-2">
        <PhotoUpload
          defectId={defect.id}
          onUploaded={(attachment) => setDefect((d) => ({ ...d, attachments: [...d.attachments, attachment] }))}
        />
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium text-muted-foreground">Corrective action</p>
        {defect.corrective_actions.length === 0 && !showActionForm && (
          <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => setShowActionForm(true)}>
            + Add corrective action
          </Button>
        )}
        {showActionForm && (
          <CorrectiveActionForm
            defectId={defect.id}
            onCreated={(action) => {
              setDefect((d) => ({ ...d, corrective_actions: [...d.corrective_actions, action] }))
              setShowActionForm(false)
            }}
            onCancel={() => setShowActionForm(false)}
          />
        )}
        {defect.corrective_actions.map((action) => (
          <div key={action.id} className="mt-1 rounded-md bg-muted p-2 text-sm">
            <p>{action.description}</p>
            <p className="text-xs text-muted-foreground">
              {action.assigned_to ? `Assigned to ${action.assigned_to.name}` : 'Unassigned'}
              {action.due_date && ` · Due ${action.due_date}`} &middot; <span className="capitalize">{action.status}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
