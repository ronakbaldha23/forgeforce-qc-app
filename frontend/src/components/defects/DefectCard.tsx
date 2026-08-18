import { useState } from 'react'
import { CorrectiveActionForm } from '../corrective-actions/CorrectiveActionForm'
import type { DefectDto } from '../../types'
import { PhotoUpload } from './PhotoUpload'

const SEVERITY_COLOR: Record<DefectDto['severity'], string> = {
  minor: 'bg-amber-100 text-amber-800',
  major: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

export function DefectCard({ defect: initial }: { defect: DefectDto }) {
  const [defect, setDefect] = useState(initial)
  const [showActionForm, setShowActionForm] = useState(false)

  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-slate-800">{defect.description}</p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${SEVERITY_COLOR[defect.severity]}`}>
          {defect.severity}
        </span>
      </div>

      {defect.attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {defect.attachments.map((a) => (
            <a key={a.id} href={a.url} target="_blank" rel="noreferrer">
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
        <p className="text-xs font-medium text-slate-500">Corrective action</p>
        {defect.corrective_actions.length === 0 && !showActionForm && (
          <button
            type="button"
            onClick={() => setShowActionForm(true)}
            className="mt-1 min-h-[40px] rounded-md border border-slate-300 px-3 text-sm text-slate-700 active:bg-slate-100"
          >
            + Add corrective action
          </button>
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
          <div key={action.id} className="mt-1 rounded-md bg-slate-50 p-2 text-sm">
            <p>{action.description}</p>
            <p className="text-xs text-slate-500">
              {action.assigned_to ? `Assigned to ${action.assigned_to.name}` : 'Unassigned'}
              {action.due_date && ` · Due ${action.due_date}`} &middot; <span className="capitalize">{action.status}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
