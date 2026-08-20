import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { DefectDto } from '../../types'
import { Button } from '@/components/ui/button'
import { DefectCard } from './DefectCard'
import { DefectForm } from './DefectForm'

export function DefectSection({
  inspectionItemResultId,
  defects: initialDefects,
}: {
  inspectionItemResultId: number
  defects: DefectDto[]
}) {
  const [defects, setDefects] = useState(initialDefects)
  const [showAddForm, setShowAddForm] = useState(false)

  function handleCreated(defect: DefectDto) {
    setDefects((d) => [...d, defect])
    setShowAddForm(false)
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-red-100 pt-3">
      {defects.map((defect) => (
        <DefectCard key={defect.id} defect={defect} onChanged={(updated) => setDefects((d) => d.map((x) => (x.id === updated.id ? updated : x)))} />
      ))}

      {defects.length === 0 ? (
        <DefectForm mode="create" inspectionItemResultId={inspectionItemResultId} onSaved={handleCreated} />
      ) : showAddForm ? (
        <div className="border-t border-dashed pt-3">
          <DefectForm
            mode="create"
            inspectionItemResultId={inspectionItemResultId}
            onSaved={handleCreated}
          />
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="mt-1 border-dashed text-red-700"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="size-4" /> Add another defect
        </Button>
      )}
    </div>
  )
}
