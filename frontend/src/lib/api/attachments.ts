import { http } from '../http'

export const attachmentsApi = {
  delete: (id: number) => http.delete<void>(`/attachments/${id}`),
}
