export type UserType = 'agency_owner' | 'agency_staff' | 'client_owner' | 'client_staff'

export interface AppUser {
  id: number
  supabase_uid: string
  user_type: UserType
  client_id: number | null
  name: string
  email: string
  whatsapp: string | null
  active: number
  created_at: string
}

export interface Client {
  id: number
  business_id: number
  name: string
  brand: string
  niche: string
  plan: string
  slug: string | null
  onboarding_step: number
  services: string[]
  whatsapp_type: 'evolution' | 'meta_api'
  whatsapp_number: string | null
  active: number
  created_at: string
}

export interface Lead {
  id: number
  client_id: number
  name: string | null
  phone: string
  email: string | null
  source: string
  stage: 'new' | 'contacted' | 'qualified' | 'booked' | 'no_show' | 'closed' | 'dnc'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ClientMessage {
  id: number
  client_id: number
  sender: 'client' | 'operator'
  content: string
  read: number
  created_at: string
}

export interface ClientNotification {
  id: number
  client_id: number
  type: string
  title: string
  body: string | null
  read: number
  created_at: string
}
