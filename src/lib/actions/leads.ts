"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/auth";
import { leadFormSchema } from "@/lib/validation/crm";
import type { LeadStatus } from "@/types/database";
import type { FormState } from "./clients";

const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "scheduled", "converted", "lost"];

function revalidateLeadViews(clientId: string) {
  revalidatePath(`/agency/clients/${clientId}`);
  revalidatePath("/agency/funis");
  revalidatePath("/agency/dashboard");
}

export async function createLeadAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAgency();
  const parsed = leadFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const d = parsed.data;
  const { error } = await supabase.from("leads").insert({
    client_id: d.client_id,
    name: d.name,
    phone: d.phone,
    email: d.email || null,
    source: d.source || "manual",
    status: d.status,
    notes: d.notes || null,
  });
  if (error) return { error: "Não foi possível criar o lead." };

  revalidateLeadViews(d.client_id);
  return { error: null, ok: true };
}

/** Mover lead no funil (select ou drag). Marca first_contact_at na 1ª saída de `new`. */
export async function updateLeadStatusAction(formData: FormData): Promise<void> {
  await requireAgency();
  const id = formData.get("id") as string;
  const status = formData.get("status") as LeadStatus;
  const clientId = formData.get("client_id") as string;
  if (!id || !LEAD_STATUSES.includes(status)) return;

  const supabase = await createClient();
  const patch: Partial<import("@/types/database").LeadRow> = { status };

  if (status !== "new") {
    const { data: lead } = await supabase.from("leads").select("first_contact_at, created_at").eq("id", id).maybeSingle();
    if (lead && !lead.first_contact_at) {
      const now = new Date();
      patch.first_contact_at = now.toISOString();
      patch.response_time_seconds = Math.max(0, Math.round((now.getTime() - new Date(lead.created_at).getTime()) / 1000));
    }
  }

  await supabase.from("leads").update(patch).eq("id", id);
  if (clientId) revalidateLeadViews(clientId);
}

export async function updateLeadNotesAction(formData: FormData): Promise<void> {
  await requireAgency();
  const id = formData.get("id") as string;
  const notes = ((formData.get("notes") as string) ?? "").slice(0, 2000);
  const clientId = formData.get("client_id") as string;
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("leads").update({ notes: notes || null }).eq("id", id);
  if (clientId) revalidateLeadViews(clientId);
}

export async function deleteLeadAction(formData: FormData): Promise<void> {
  await requireAgency();
  const id = formData.get("id") as string;
  const clientId = formData.get("client_id") as string;
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("leads").delete().eq("id", id);
  if (clientId) revalidateLeadViews(clientId);
}
