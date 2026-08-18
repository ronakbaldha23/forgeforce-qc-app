import { http } from '../http'
import type { CorrectiveActionDto } from '../../types'

export interface CreateCorrectiveActionPayload {
  defect_id: number
  description: string
  assigned_to?: number | null
  due_date?: string | null
}

export interface UpdateCorrectiveActionPayload {
  status?: CorrectiveActionDto['status']
  completion_notes?: string | null
  description?: string
  assigned_to?: number | null
  due_date?: string | null
}

export const correctiveActionsApi = {
  create: (payload: CreateCorrectiveActionPayload) =>
    http.post<{ data: CorrectiveActionDto }>('/corrective-actions', payload).then((r) => r.data),
  update: (id: number, payload: UpdateCorrectiveActionPayload) =>
    http.patch<{ data: CorrectiveActionDto }>(`/corrective-actions/${id}`, payload).then((r) => r.data),
}
