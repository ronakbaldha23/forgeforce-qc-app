import { http } from '../http'
import type { AiSuggestionDto } from '../../types'

export const aiApi = {
  generateDefectSummary: (inspectionId: number) =>
    http.post<{ data: AiSuggestionDto }>('/ai/defect-summary', { inspection_id: inspectionId }).then((r) => r.data),
  review: (id: number, status: 'accepted' | 'rejected', acceptedText?: string) =>
    http
      .patch<{ data: AiSuggestionDto }>(`/ai-suggestions/${id}`, { status, accepted_text: acceptedText })
      .then((r) => r.data),
}
