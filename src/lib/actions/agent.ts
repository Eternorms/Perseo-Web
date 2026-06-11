"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext, isAgency, requireAgency } from "@/lib/auth";
import type { AgentActionStatus } from "@/types/database";

export interface AgentRequestState {
  error: string | null;
  ok?: boolean;
}

const requestSchema = z.object({
  action_type: z.enum(["reschedule", "cancel_appointment"]),
  appointment_id: z.uuid("Agendamento inválido."),
  preferred_at: z.string().optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

/**
 * Cliente solicita uma ação ao agente de IA (reagendar/cancelar via
 * WhatsApp). A solicitação entra em agent_actions como `pending`; a agência
 * aprova no dashboard e o agente/desktop executa e grava `result`.
 */
export async function requestAgentActionAction(_prev: AgentRequestState, formData: FormData): Promise<AgentRequestState> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Sessão expirada." };

  const clientId = isAgency(ctx.appUser) ? (formData.get("client_id") as string) : ctx.appUser.client_id;
  if (!clientId) return { error: "Sem cliente vinculado." };

  const parsed = requestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const d = parsed.data;

  let preferredAt: string | null = null;
  if (d.action_type === "reschedule") {
    const when = d.preferred_at ? new Date(d.preferred_at) : null;
    if (!when || Number.isNaN(when.getTime())) return { error: "Informe a nova data e hora preferida." };
    if (when.getTime() < Date.now()) return { error: "Escolha um horário no futuro." };
    preferredAt = when.toISOString();
  }

  const supabase = await createClient();

  // o agendamento precisa pertencer ao cliente (RLS já filtra a leitura)
  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, patient_name, scheduled_at")
    .eq("id", d.appointment_id)
    .eq("client_id", clientId)
    .maybeSingle();
  if (!appointment) return { error: "Agendamento não encontrado." };

  const { error } = await supabase.from("agent_actions").insert({
    client_id: clientId,
    action_type: d.action_type,
    requested_by: ctx.appUser.id,
    payload: {
      appointment_id: appointment.id,
      patient_name: appointment.patient_name,
      current_at: appointment.scheduled_at,
      preferred_at: preferredAt,
      note: d.note || null,
    },
  });
  if (error) return { error: "Não foi possível registrar a solicitação." };

  // confirmação no sino do cliente (RLS permite inserir a própria)
  await supabase.from("client_notifications").insert({
    client_id: clientId,
    type: "agent_request",
    title: d.action_type === "reschedule" ? "Reagendamento solicitado" : "Cancelamento solicitado",
    body: `${appointment.patient_name} — o agente cuida do contato e te avisamos aqui.`,
    data: { appointment_id: appointment.id },
  });

  revalidatePath("/client/appointments");
  revalidatePath("/agency/dashboard");
  return { error: null, ok: true };
}

const TRANSITIONS: Record<string, AgentActionStatus[]> = {
  pending: ["approved", "cancelled"],
  approved: ["executed", "failed", "cancelled"],
};

/** Agência gerencia o ciclo: pending → approved → executed/failed (ou cancela). */
export async function updateAgentActionStatusAction(formData: FormData): Promise<void> {
  await requireAgency();
  const id = formData.get("id") as string;
  const status = formData.get("status") as AgentActionStatus;
  if (!id || !status) return;

  const supabase = await createClient();
  const { data: action } = await supabase.from("agent_actions").select("status").eq("id", id).maybeSingle();
  if (!action || !TRANSITIONS[action.status]?.includes(status)) return;

  await supabase.from("agent_actions").update({ status }).eq("id", id);
  revalidatePath("/agency/dashboard");
  revalidatePath("/client/appointments");
}
