import { http } from '../http'
import type { InspectionItemHistoryDto, InspectionItemResultDto, ItemResult } from '../../types'

export interface UpdateItemResultPayload {
  result: ItemResult
  comment?: string | null
  change_reason?: string | null
}

export const inspectionItemsApi = {
  update: (resultId: number, payload: UpdateItemResultPayload) =>
    http.put<{ data: InspectionItemResultDto }>(`/inspection-items/${resultId}`, payload).then((r) => r.data),
  history: (resultId: number) =>
    http.get<{ data: InspectionItemHistoryDto[] }>(`/inspection-items/${resultId}/history`).then((r) => r.data),
}
