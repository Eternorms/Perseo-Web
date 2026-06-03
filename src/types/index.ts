export type UserType = 'agency_owner' | 'agency_staff' | 'client_owner' | 'client_staff'

export type ClientStatus = 'onboarding' | 'active' | 'paused' | 'churned'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'scheduled' | 'converted' | 'lost'
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
export type WhatsAppType = 'evolution' | 'meta'
export type SenderType = 'agency' | 'client'

export interface AppUser {
  id: string
  supabase_uid: string
  user_type: UserType
  client_id: string | null
  name: string
  email: string
  created_at: string
}

export interface Client {
  id: string
  name: string
  business_name: string
  niche: string | null
  status: ClientStatus
  onboarding_step: number
  whatsapp_type: WhatsAppType | null
  whatsapp_instance: string | null
  whatsapp_phone: string | null
  meta_page_id: string | null
  meta_form_id: string | null
  calendar_id: string | null
  agent_prompt: string | null
  agent_active: boolean
  plan: string
  monthly_value: number | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  client_id: string
  name: string | null
  phone: string
  email: string | null
  source: string
  status: LeadStatus
  meta_lead_id: string | null
  first_contact_at: string | null
  response_time_seconds: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  client_id: string
  lead_id: string | null
  patient_name: string
  patient_phone: string | null
  scheduled_at: string
  calendar_event_id: string | null
  status: AppointmentStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ClientMessage {
  id: string
  client_id: string
  sender_id: string
  sender_type: SenderType
  body: string
  read_at: string | null
  created_at: string
}

export interface ClientNotification {
  id: string
  client_id: string
  type: string
  title: string
  body: string | null
  read_at: string | null
  data: Record<string, unknown> | null
  created_at: string
}

export interface AgentAction {
  id: string
  client_id: string
  action_type: 'send_message' | 'cancel_appointment' | 'reschedule' | 'qualify_lead'
  requested_by: string | null
  target_phone: string | null
  appointment_id: string | null
  lead_id: string | null
  payload: Record<string, unknown> | null
  status: 'pending' | 'done' | 'failed'
  result: Record<string, unknown> | null
  created_at: string
  completed_at: string | null
}

export interface JobQueue {
  id: string
  job_type: string
  client_id: string | null
  payload: Record<string, unknown>
  status: 'pending' | 'running' | 'done' | 'failed'
  priority: number
  result: Record<string, unknown> | null
  error: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}
