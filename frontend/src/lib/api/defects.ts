import { http } from '../http'
import type { AttachmentDto, DefectDto } from '../../types'

export interface CreateDefectPayload {
  inspection_item_result_id: number
  description: string
  severity: 'minor' | 'major' | 'critical'
}

export const defectsApi = {
  create: (payload: CreateDefectPayload) =>
    http.post<{ data: DefectDto }>('/defects', payload).then((r) => r.data),
  update: (id: number, payload: Partial<CreateDefectPayload & { status: DefectDto['status'] }>) =>
    http.patch<{ data: DefectDto }>(`/defects/${id}`, payload).then((r) => r.data),
  uploadPhoto: (defectId: number, file: File) => {
    const form = new FormData()
    form.append('photo', file)
    return http.postForm<{ data: AttachmentDto }>(`/defects/${defectId}/attachments`, form).then((r) => r.data)
  },
}
