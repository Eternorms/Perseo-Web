/**
 * Labels pt-BR e tom de cor por status — fonte única para badges/selects.
 * `tone` mapeia para variantes do <StatusBadge>.
 */

import type {
  AgentActionStatus,
  AgentActionType,
  AppointmentStatus,
  ClientStatus,
  LeadStatus,
  SocialPostStatus,
  TaskPriority,
  TaskStatus,
  UserType,
} from "@/types/database";
import type { CreativeStatus } from "@/types/perseo";

export type Tone = "neutral" | "neon" | "loss" | "warn" | "info";

export const CLIENT_STATUS: Record<ClientStatus, { label: string; tone: Tone }> = {
  onboarding: { label: "Onboarding", tone: "info" },
  active: { label: "Ativo", tone: "neon" },
  paused: { label: "Pausado", tone: "warn" },
  churned: { label: "Churned", tone: "loss" },
};

export const LEAD_STATUS: Record<LeadStatus, { label: string; tone: Tone }> = {
  new: { label: "Novo", tone: "info" },
  contacted: { label: "Contatado", tone: "neutral" },
  qualified: { label: "Qualificado", tone: "warn" },
  scheduled: { label: "Agendado", tone: "info" },
  converted: { label: "Convertido", tone: "neon" },
  lost: { label: "Perdido", tone: "loss" },
};

export const APPOINTMENT_STATUS: Record<AppointmentStatus, { label: string; tone: Tone }> = {
  scheduled: { label: "Agendado", tone: "info" },
  confirmed: { label: "Confirmado", tone: "neon" },
  cancelled: { label: "Cancelado", tone: "loss" },
  completed: { label: "Realizado", tone: "neutral" },
  no_show: { label: "Não compareceu", tone: "warn" },
};

export const TASK_STATUS: Record<TaskStatus, { label: string; tone: Tone }> = {
  backlog: { label: "Backlog", tone: "neutral" },
  todo: { label: "A fazer", tone: "info" },
  in_progress: { label: "Em progresso", tone: "warn" },
  review: { label: "Revisão", tone: "info" },
  done: { label: "Concluída", tone: "neon" },
};

export const TASK_PRIORITY: Record<TaskPriority, { label: string; tone: Tone }> = {
  low: { label: "Baixa", tone: "neutral" },
  medium: { label: "Média", tone: "info" },
  high: { label: "Alta", tone: "loss" },
};

export const CREATIVE_STATUS: Record<CreativeStatus, { label: string; tone: Tone }> = {
  pending: { label: "Aguardando", tone: "warn" },
  approved: { label: "Aprovado", tone: "neon" },
  rejected: { label: "Rejeitado", tone: "loss" },
  revision: { label: "Em revisão", tone: "info" },
};

export const POST_STATUS: Record<SocialPostStatus, { label: string; tone: Tone }> = {
  draft: { label: "Rascunho", tone: "neutral" },
  scheduled: { label: "Agendado", tone: "info" },
  published: { label: "Publicado", tone: "neon" },
  failed: { label: "Falhou", tone: "loss" },
};

export const USER_TYPE: Record<UserType, string> = {
  agency_owner: "Owner",
  agency_staff: "Equipe",
  client_owner: "Cliente (owner)",
  client_staff: "Cliente (equipe)",
};

export const AGENT_ACTION: Record<AgentActionType, string> = {
  send_message: "Enviar mensagem",
  cancel_appointment: "Cancelar agendamento",
  reschedule: "Reagendar",
  qualify_lead: "Qualificar lead",
};

export const AGENT_ACTION_STATUS: Record<AgentActionStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pendente", tone: "warn" },
  approved: { label: "Aprovada", tone: "info" },
  executed: { label: "Executada", tone: "neon" },
  failed: { label: "Falhou", tone: "loss" },
  cancelled: { label: "Cancelada", tone: "neutral" },
};

export const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  meta: "Meta",
};

export const SERVICE_LABEL: Record<string, string> = {
  traffic: "Tráfego",
  content: "Conteúdo",
};
