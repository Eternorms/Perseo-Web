/**
 * Tipos do schema `public` — bounded context que ESTE app possui.
 * Mantidos em sincronia manual com supabase/migrations/.
 */

export type ClientStatus = "onboarding" | "active" | "paused" | "churned";
export type WhatsappType = "evolution" | "meta";
export type UserType = "agency_owner" | "agency_staff" | "client_owner" | "client_staff";
export type LeadStatus = "new" | "contacted" | "qualified" | "scheduled" | "converted" | "lost";
export type AppointmentStatus = "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";
export type DealStage = "identified" | "warmed" | "conversation" | "audit" | "proposal" | "negotiation" | "won" | "lost";
export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type SocialPostStatus = "draft" | "scheduled" | "published" | "failed";
export type SocialPlatform = "instagram" | "facebook" | "tiktok";
export type AgentActionType = "send_message" | "cancel_appointment" | "reschedule" | "qualify_lead";
export type AgentActionStatus = "pending" | "approved" | "executed" | "failed" | "cancelled";
export type FollowupStatus = "pending" | "sent" | "cancelled";
export type JobStatus = "pending" | "running" | "done" | "failed";
export type SenderType = "agency" | "client";
export type ClientService = "traffic" | "content";

export type ClientRow = {
  id: string;
  name: string;
  business_name: string;
  niche: string | null;
  status: ClientStatus;
  onboarding_step: number;
  whatsapp_type: WhatsappType | null;
  whatsapp_instance: string | null;
  whatsapp_phone: string | null;
  meta_page_id: string | null;
  meta_form_id: string | null;
  ig_page_id: string | null;
  meta_token: string | null;
  calendar_id: string | null;
  perseo_client_id: number | null;
  agent_prompt: string | null;
  agent_active: boolean;
  plan: string | null;
  services: ClientService[];
  monthly_value: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  intake: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type AppUserRow = {
  id: string;
  supabase_uid: string;
  user_type: UserType;
  client_id: string | null;
  name: string;
  email: string;
  created_at: string;
}

export type Deal = {
  id: string;
  business_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  niche: string | null;
  source: string;
  stage: DealStage;
  estimated_value: number | null;
  teardown_url: string | null;
  notes: string | null;
  lost_reason: string | null;
  owner_id: string | null;
  converted_client_id: string | null;
  last_contact_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type LeadRow = {
  id: string;
  client_id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  status: LeadStatus;
  meta_lead_id: string | null;
  first_contact_at: string | null;
  response_time_seconds: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type AppointmentRow = {
  id: string;
  client_id: string;
  lead_id: string | null;
  patient_name: string;
  patient_phone: string | null;
  scheduled_at: string;
  calendar_event_id: string | null;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type FollowupRow = {
  id: string;
  lead_id: string;
  client_id: string;
  day: number;
  scheduled_at: string;
  sent_at: string | null;
  status: FollowupStatus;
  message: string | null;
  created_at: string;
}

export type ClientMessageRow = {
  id: string;
  client_id: string;
  sender_id: string;
  sender_type: SenderType;
  body: string;
  read_at: string | null;
  created_at: string;
}

export type ClientNotificationRow = {
  id: string;
  client_id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
}

export type AgentActionRow = {
  id: string;
  client_id: string;
  action_type: AgentActionType;
  requested_by: string | null;
  payload: Record<string, unknown> | null;
  status: AgentActionStatus;
  result: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  client_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export type SocialPostRow = {
  id: string;
  client_id: string;
  platform: SocialPlatform;
  caption: string | null;
  media_url: string | null;
  media_type: "image" | "video" | null;
  scheduled_at: string | null;
  status: SocialPostStatus;
  meta_post_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CampaignMetricRow = {
  id: string;
  client_id: string;
  date: string;
  platform: string;
  impressions: number;
  reach: number;
  clicks: number;
  leads: number;
  spend: number;
  cpl: number | null;
  created_at: string;
}

export type FunnelStageRow = {
  id: string;
  client_id: string;
  value: string;
  label: string;
  color: string | null;
  position: number;
  created_at: string;
}

export type JobRow = {
  id: string;
  job_type: string;
  client_id: string | null;
  payload: Record<string, unknown> | null;
  status: JobStatus;
  priority: number;
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

/* Database genérico para supabase-js. Insert/Update parciais: NOT NULL e
   defaults são responsabilidade das migrations; validação de entrada é zod.
   Relationships seguem os nomes default de FK do Postgres (<tabela>_<coluna>_fkey)
   para habilitar selects aninhados tipados (ex.: clients(name)). */
type Rel<Name extends string, Col extends string, Ref extends string, One extends boolean = false> = {
  foreignKeyName: Name;
  columns: [Col];
  isOneToOne: One;
  referencedRelation: Ref;
  referencedColumns: ["id"];
};

type Def<R, Rels extends unknown[] = []> = { Row: R; Insert: Partial<R>; Update: Partial<R>; Relationships: Rels };

type ToClient<T extends string> = Rel<`${T}_client_id_fkey`, "client_id", "clients">;

export type Database = {
  public: {
    Tables: {
      clients: Def<ClientRow>;
      deals: Def<Deal>;
      app_users: Def<AppUserRow, [ToClient<"app_users">]>;
      leads: Def<LeadRow, [ToClient<"leads">]>;
      appointments: Def<AppointmentRow, [ToClient<"appointments">, Rel<"appointments_lead_id_fkey", "lead_id", "leads">]>;
      followup_queue: Def<FollowupRow, [ToClient<"followup_queue">, Rel<"followup_queue_lead_id_fkey", "lead_id", "leads">]>;
      client_messages: Def<ClientMessageRow, [ToClient<"client_messages">, Rel<"client_messages_sender_id_fkey", "sender_id", "app_users">]>;
      client_notifications: Def<ClientNotificationRow, [ToClient<"client_notifications">]>;
      agent_actions: Def<AgentActionRow, [ToClient<"agent_actions">, Rel<"agent_actions_requested_by_fkey", "requested_by", "app_users">]>;
      tasks: Def<
        TaskRow,
        [
          ToClient<"tasks">,
          Rel<"tasks_assigned_to_fkey", "assigned_to", "app_users">,
          Rel<"tasks_created_by_fkey", "created_by", "app_users">,
        ]
      >;
      social_posts: Def<SocialPostRow, [ToClient<"social_posts">]>;
      campaign_metrics: Def<CampaignMetricRow, [ToClient<"campaign_metrics">]>;
      funnel_stages: Def<FunnelStageRow, [ToClient<"funnel_stages">]>;
      job_queue: Def<JobRow, [ToClient<"job_queue">]>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
