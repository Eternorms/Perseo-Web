import { z } from "zod";

const optional = (max = 200) => z.string().trim().max(max).optional().or(z.literal(""));

export const clientFormSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da marca.").max(120),
  business_name: z.string().trim().min(2, "Informe a razão social.").max(160),
  niche: optional(80),
  status: z.enum(["onboarding", "active", "paused", "churned"]),
  plan: optional(40),
  monthly_value: z.coerce.number().min(0).max(10_000_000).optional().or(z.nan()).transform((v) => (Number.isNaN(v) ? null : v)),
  services: z.array(z.enum(["traffic", "content"])).default([]),
  contact_name: optional(120),
  contact_email: z.email("E-mail inválido.").optional().or(z.literal("")),
  contact_phone: optional(40),
  whatsapp_type: z.enum(["evolution", "meta"]).optional().or(z.literal("")),
  whatsapp_instance: optional(80),
  whatsapp_phone: optional(40),
  meta_page_id: optional(64),
  meta_form_id: optional(64),
  ig_page_id: optional(64),
  meta_token: optional(512),
  calendar_id: optional(256),
  perseo_client_id: z.coerce.number().int().min(1).optional().or(z.nan()).transform((v) => (Number.isNaN(v) ? null : v)),
  agent_prompt: z.string().trim().max(8000).optional().or(z.literal("")),
  agent_active: z.boolean(),
});

export const leadFormSchema = z.object({
  client_id: z.uuid("Selecione o cliente."),
  name: z.string().trim().min(2, "Informe o nome do lead.").max(120),
  phone: z.string().trim().min(8, "Telefone inválido.").max(40),
  email: z.email("E-mail inválido.").optional().or(z.literal("")),
  source: optional(60),
  status: z.enum(["new", "contacted", "qualified", "scheduled", "converted", "lost"]).default("new"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const appointmentFormSchema = z.object({
  client_id: z.uuid("Selecione o cliente."),
  lead_id: z.uuid().optional().or(z.literal("")),
  patient_name: z.string().trim().min(2, "Informe o nome.").max(120),
  patient_phone: optional(40),
  scheduled_at: z.string().min(10, "Informe data e hora."),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const taskFormSchema = z.object({
  title: z.string().trim().min(2, "Dê um título à tarefa.").max(160),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  status: z.enum(["backlog", "todo", "in_progress", "review", "done"]).default("backlog"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  client_id: z.uuid().optional().or(z.literal("")),
  assigned_to: z.uuid().optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal("")),
});

export const postFormSchema = z.object({
  client_id: z.uuid("Selecione o cliente."),
  platform: z.enum(["instagram", "facebook", "tiktok"]),
  caption: z.string().trim().max(3000).optional().or(z.literal("")),
  media_url: z.url("URL de mídia inválida.").optional().or(z.literal("")),
  media_type: z.enum(["image", "video"]).optional().or(z.literal("")),
  scheduled_at: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "scheduled", "published", "failed"]).default("draft"),
});

export const funnelStagesSchema = z.object({
  client_id: z.uuid(),
  stages: z
    .array(
      z.object({
        value: z.string().trim().min(1).max(40),
        label: z.string().trim().min(1, "Etapa sem nome.").max(60),
        color: z.string().trim().max(20).optional().or(z.literal("")),
      }),
    )
    .min(2, "O funil precisa de ao menos 2 etapas.")
    .max(8, "Máximo de 8 etapas."),
});

export const inviteUserSchema = z.object({
  email: z.email("E-mail inválido."),
  name: z.string().trim().min(2, "Informe o nome.").max(120),
  user_type: z.enum(["agency_owner", "agency_staff", "client_owner", "client_staff"]),
  client_id: z.uuid().optional().or(z.literal("")),
});

export const messageSchema = z.object({
  client_id: z.uuid(),
  body: z.string().trim().min(1, "Mensagem vazia.").max(4000),
});
