import { http } from '../http'
import type { InspectionDto, InspectionTemplate } from '../../types'

export const inspectionsApi = {
  templateForMachine: (machineId: number) =>
    http.get<{ data: InspectionTemplate }>(`/inspection-templates/for-machine/${machineId}`).then((r) => r.data),
  start: (machineId: number) =>
    http.post<{ data: InspectionDto }>('/inspections', { machine_id: machineId }).then((r) => r.data),
  get: (id: number) => http.get<{ data: InspectionDto }>(`/inspections/${id}`).then((r) => r.data),
  submit: (id: number) => http.patch<{ data: InspectionDto }>(`/inspections/${id}/submit`).then((r) => r.data),
}
