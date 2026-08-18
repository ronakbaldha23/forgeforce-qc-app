export type Role = 'engineer' | 'quality_manager' | 'admin'

export interface User {
  id: number
  name: string
  email: string
  role: Role
}

export interface Machine {
  id: number
  code: string
  serial_number: string
  name: string
  location: string | null
  machine_type: string
}

export interface MachineDetail {
  id: number
  code: string
  serial_number: string
  name: string
  location: string | null
  machine_type: { id: number; name: string }
  draft_inspection: { id: number; started_at: string } | null
}

export interface InspectionTemplateItem {
  id: number
  label: string
  help_text: string | null
  sort_order: number
}

export interface InspectionTemplate {
  id: number
  name: string
  version: number
  items: InspectionTemplateItem[]
}

export type ItemResult = 'pass' | 'fail' | 'na'

export interface AttachmentDto {
  id: number
  url: string
  original_filename: string
  mime_type: string
  size_bytes: number
  uploaded_by: string | null
  created_at: string
}

export interface CorrectiveActionDto {
  id: number
  defect_id: number
  description: string
  assigned_to: { id: number; name: string } | null
  due_date: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'verified'
  completion_notes: string | null
  completed_at: string | null
  created_by: string | null
  created_at: string
}

export interface DefectDto {
  id: number
  inspection_item_result_id: number
  description: string
  severity: 'minor' | 'major' | 'critical'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_by: string | null
  created_at: string
  attachments: AttachmentDto[]
  corrective_actions: CorrectiveActionDto[]
}

export interface InspectionItemResultDto {
  id: number
  inspection_id: number
  template_item: InspectionTemplateItem
  result: ItemResult | null
  comment: string | null
  updated_by: string | null
  updated_at: string
  has_history?: boolean
  defects: DefectDto[]
}

export interface InspectionItemHistoryDto {
  id: number
  previous_result: ItemResult | null
  new_result: ItemResult
  previous_comment: string | null
  new_comment: string | null
  changed_by: string | null
  changed_at: string
  change_reason: string | null
}

export type InspectionStatus = 'draft' | 'submitted'

export interface InspectionDto {
  id: number
  machine: { id: number; code: string; serial_number: string; name: string }
  inspector: string | null
  status: InspectionStatus
  started_at: string
  submitted_at: string | null
  item_results: InspectionItemResultDto[]
}

export interface InspectionSummaryDto {
  id: number
  inspector: string | null
  status: InspectionStatus
  started_at: string
  submitted_at: string | null
  fail_count: number
  defect_count: number
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
