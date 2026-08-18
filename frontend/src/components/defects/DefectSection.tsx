import { useState } from 'react'
import type { DefectDto } from '../../types'
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

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-red-100 pt-3">
      {defects.map((defect) => (
        <DefectCard key={defect.id} defect={defect} />
      ))}
      <DefectForm
        inspectionItemResultId={inspectionItemResultId}
        onCreated={(defect) => setDefects((d) => [...d, defect])}
      />
    </div>
  )
}
