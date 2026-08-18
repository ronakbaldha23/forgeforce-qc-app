import { http } from '../http'
import type { InspectionSummaryDto, Machine, MachineDetail } from '../../types'

export const machinesApi = {
  list: () => http.get<{ data: Machine[] }>('/machines').then((r) => r.data),
  get: (id: number) => http.get<{ data: MachineDetail }>(`/machines/${id}`).then((r) => r.data),
  inspections: (id: number) =>
    http.get<{ data: InspectionSummaryDto[] }>(`/machines/${id}/inspections`).then((r) => r.data),
}
