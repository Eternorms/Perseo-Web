export interface Client {
  id: number;
  name: string;
  brand: string;
  niche: string;
  plan: string;
  stage: string;
  active: number;
  plan_value: number;
  monthly_budget: number;
  current_roas: number | null;
  current_cpa: number | null;
  client_email: string | null;
  client_whatsapp: string | null;
  last_contact_at: string | null;
  created_at: string;
}

export interface CreativeApproval {
  id: number;
  client_id: number;
  video_id: number | null;
  title: string;
  description: string | null;
  media_url: string;
  thumbnail_url: string | null;
  status: "pending" | "approved" | "rejected" | "revision";
  client_feedback: string | null;
  submitted_at: string;
  decided_at: string | null;
  brand?: string;
  client_name?: string;
}

export interface ChatMessage {
  id: number;
  client_id: number;
  sender_type: "agency" | "client" | "bot";
  sender_name: string | null;
  content: string;
  attachments: unknown[];
  read_at: string | null;
  created_at: string;
}

export interface Notification {
  id: number;
  client_id: number;
  type: string;
  title: string;
  body: string | null;
  data: unknown;
  read_at: string | null;
  created_at: string;
}

export interface Appointment {
  id: number;
  client_id: number;
  title: string;
  scheduled_at: string;
  duration_min: number;
  meet_link: string | null;
  notes: string | null;
  status: "scheduled" | "completed" | "cancelled";
  created_at: string;
}

export interface ClientUpload {
  id: number;
  client_id: number;
  filename: string;
  drive_file_id: string | null;
  drive_link: string | null;
  upload_type: string;
  notes: string | null;
  created_at: string;
}

export interface MetricCard {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
}
