export type NotificationType = "education" | "maintenance" | "legal" | "technical"
export type Priority = "low" | "medium" | "high"
export type DeviceStatus = "dirty" | "overdue" | "normal"

export interface EducationContent {
  id: string
  type: NotificationType
  priority: Priority
  tag: string
  title: string
  content: string
  cta_label: string
  link: string
  expiry_date?: string
  conditions?: {
    device_status?: DeviceStatus
    compliance_score?: string
  }
  created_at?: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}
