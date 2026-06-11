"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext, isAgency, requireAgency } from "@/lib/auth";
import { appointmentFormSchema } from "@/lib/validation/crm";
import type { AppointmentStatus } from "@/types/database";
import type { FormState } from "./clients";

const STATUSES: AppointmentStatus[] = ["scheduled", "confirmed", "cancelled", "completed", "no_show"];

function revalidateAppointmentViews(clientId: string) {
  revalidatePath("/agency/schedule");
  revalidatePath(`/agency/clients/${clientId}`);
  revalidatePath("/client/appointments");
  revalidatePath("/client/dashboard");
}

export async function createAppointmentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAgency();
  const parsed = appointmentFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const scheduledAt = new Date(parsed.data.scheduled_at);
  if (Number.isNaN(scheduledAt.getTime())) return { error: "Data/hora inválida." };

  const supabase = await createClient();
  const d = parsed.data;
  const { error } = await supabase.from("appointments").insert({
    client_id: d.client_id,
    lead_id: d.lead_id || null,
    patient_name: d.patient_name,
    patient_phone: d.patient_phone || null,
    scheduled_at: scheduledAt.toISOString(),
    notes: d.notes || null,
  });
  if (error) return { error: "Não foi possível criar o agendamento." };

  // se veio de um lead, move o lead para "scheduled"
  if (d.lead_id) {
    await supabase.from("leads").update({ status: "scheduled" }).eq("id", d.lead_id).in("status", ["new", "contacted", "qualified"]);
  }

  revalidateAppointmentViews(d.client_id);
  return { error: null, ok: true };
}

/**
 * Mudança de status — agência muda qualquer; cliente só confirma/cancela os
 * próprios (RLS garante a linha; aqui garantimos a transição permitida).
 */
export async function updateAppointmentStatusAction(formData: FormData): Promise<void> {
  const ctx = await getSessionContext();
  if (!ctx) return;

  const id = formData.get("id") as string;
  const status = formData.get("status") as AppointmentStatus;
  const clientId = formData.get("client_id") as string;
  if (!id || !STATUSES.includes(status)) return;

  if (!isAgency(ctx.appUser) && !["confirmed", "cancelled"].includes(status)) return;

  const supabase = await createClient();
  await supabase.from("appointments").update({ status }).eq("id", id);
  if (clientId) revalidateAppointmentViews(clientId);
}
