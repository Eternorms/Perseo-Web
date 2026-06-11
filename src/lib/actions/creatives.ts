"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, perseoDb } from "@/lib/supabase/admin";
import { getSessionContext, isAgency, requireAgency } from "@/lib/auth";
import type { CreativeStatus } from "@/types/perseo";

export interface CreativeDecisionState {
  error: string | null;
  ok?: boolean;
}

const DECISIONS: CreativeStatus[] = ["approved", "rejected", "revision"];

/**
 * ÚNICA escrita permitida no schema perseo: decisão de aprovação.
 * Cliente decide apenas criativos do próprio perseo_client_id (verificado
 * via ponte); agência decide qualquer um. Toda decisão gera notificação.
 */
export async function decideCreativeAction(_prev: CreativeDecisionState, formData: FormData): Promise<CreativeDecisionState> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Sessão expirada." };

  const creativeId = Number(formData.get("creative_id"));
  const decision = formData.get("decision") as CreativeStatus;
  const feedback = ((formData.get("feedback") as string) ?? "").trim().slice(0, 2000);

  if (!Number.isInteger(creativeId) || !DECISIONS.includes(decision)) {
    return { error: "Decisão inválida." };
  }
  if ((decision === "revision" || decision === "rejected") && feedback.length < 3) {
    return { error: "Conte o que precisa mudar — o feedback orienta a próxima versão." };
  }

  // autorização: agência decide tudo; cliente só o próprio engine
  let allowedPerseoId: number | null = null;
  let notifyClientId: string | null = null;

  if (isAgency(ctx.appUser)) {
    allowedPerseoId = null; // sem restrição
  } else {
    if (!ctx.client?.perseo_client_id) return { error: "Sua conta ainda não está ligada ao engine de produção." };
    allowedPerseoId = ctx.client.perseo_client_id;
    notifyClientId = ctx.client.id;
  }

  try {
    const db = perseoDb();
    let query = db
      .from("creative_approvals")
      .update({
        status: decision,
        client_feedback: feedback || null,
        decided_at: new Date().toISOString(),
      })
      .eq("id", creativeId);
    if (allowedPerseoId != null) query = query.eq("client_id", allowedPerseoId);

    const { data, error } = await query.select("id, client_id, title").maybeSingle();
    if (error) throw error;
    if (!data) return { error: "Criativo não encontrado para a sua conta." };

    // resolve o cliente público para notificar (agência decidindo)
    const admin = createAdminClient();
    if (!notifyClientId) {
      const { data: pub } = await admin.from("clients").select("id").eq("perseo_client_id", data.client_id).maybeSingle();
      notifyClientId = pub?.id ?? null;
    }

    if (notifyClientId) {
      const labels: Record<CreativeStatus, string> = {
        approved: "aprovado",
        rejected: "rejeitado",
        revision: "enviado para revisão",
        pending: "pendente",
      };
      await admin.from("client_notifications").insert({
        client_id: notifyClientId,
        type: "creative_decision",
        title: `Criativo ${labels[decision]}`,
        body: data.title ? `“${data.title}” foi ${labels[decision]}.` : `Um criativo foi ${labels[decision]}.`,
        data: { creative_id: data.id, decision },
      });
    }
  } catch {
    return { error: "Falha ao registrar a decisão. Tente novamente." };
  }

  revalidatePath("/client/criativos");
  revalidatePath("/agency/criativos");
  revalidatePath("/agency/studio");
  return { error: null, ok: true };
}

/** Agência agenda a publicação de um criativo aprovado (perseo.scheduled_at). */
export async function scheduleCreativeAction(_prev: CreativeDecisionState, formData: FormData): Promise<CreativeDecisionState> {
  await requireAgency();

  const creativeId = Number(formData.get("creative_id"));
  const scheduledAt = formData.get("scheduled_at") as string;
  if (!Number.isInteger(creativeId)) return { error: "Criativo inválido." };

  const when = scheduledAt ? new Date(scheduledAt) : null;
  if (scheduledAt && (when == null || Number.isNaN(when.getTime()))) return { error: "Data inválida." };

  try {
    const { data, error } = await perseoDb()
      .from("creative_approvals")
      .update({ scheduled_at: when ? when.toISOString() : null })
      .eq("id", creativeId)
      .eq("status", "approved")
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return { error: "Só criativos aprovados podem ser agendados." };
  } catch {
    return { error: "Falha ao agendar. Tente novamente." };
  }

  revalidatePath("/agency/criativos");
  revalidatePath("/agency/studio");
  return { error: null, ok: true };
}
