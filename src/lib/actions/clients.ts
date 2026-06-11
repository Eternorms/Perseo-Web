"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAgency, requireOwner } from "@/lib/auth";
import { clientFormSchema } from "@/lib/validation/crm";
import type { ClientRow } from "@/types/database";

export interface FormState {
  error: string | null;
  ok?: boolean;
}

function parseClientForm(formData: FormData): { data: Partial<ClientRow> } | { error: string } {
  const raw = Object.fromEntries(formData);
  const parsed = clientFormSchema.safeParse({
    ...raw,
    services: formData.getAll("services"),
    agent_active: formData.get("agent_active") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const d = parsed.data;
  const nul = (v: string | undefined) => (v && v.length > 0 ? v : null);
  return {
    data: {
      name: d.name,
      business_name: d.business_name,
      niche: nul(d.niche),
      status: d.status,
      plan: nul(d.plan),
      monthly_value: d.monthly_value,
      services: d.services,
      contact_name: nul(d.contact_name),
      contact_email: nul(d.contact_email),
      contact_phone: nul(d.contact_phone),
      whatsapp_type: d.whatsapp_type === "" || d.whatsapp_type === undefined ? null : d.whatsapp_type,
      whatsapp_instance: nul(d.whatsapp_instance),
      whatsapp_phone: nul(d.whatsapp_phone),
      meta_page_id: nul(d.meta_page_id),
      meta_form_id: nul(d.meta_form_id),
      ig_page_id: nul(d.ig_page_id),
      meta_token: nul(d.meta_token),
      calendar_id: nul(d.calendar_id),
      perseo_client_id: d.perseo_client_id,
      agent_prompt: nul(d.agent_prompt),
      agent_active: d.agent_active,
    },
  };
}

export async function createClientAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAgency();
  const parsed = parseClientForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...parsed.data, onboarding_step: parsed.data.status === "onboarding" ? 1 : 7 })
    .select("id")
    .single();
  if (error || !data) return { error: "Não foi possível criar o cliente." };

  revalidatePath("/agency/clients");
  redirect(`/agency/clients/${data.id}`);
}

export async function updateClientAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAgency();
  const id = formData.get("id") as string;
  if (!id) return { error: "Cliente inválido." };

  const parsed = parseClientForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("clients").update(parsed.data).eq("id", id);
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Esse perseo_client_id já está vinculado a outro cliente."
          : "Não foi possível salvar as alterações.",
    };
  }

  revalidatePath(`/agency/clients/${id}`);
  revalidatePath("/agency/clients");
  return { error: null, ok: true };
}

export async function deleteClientAction(formData: FormData): Promise<void> {
  await requireOwner();
  const id = formData.get("id") as string;
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("clients").delete().eq("id", id);
  revalidatePath("/agency/clients");
  redirect("/agency/clients");
}
