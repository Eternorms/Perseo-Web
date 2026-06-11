"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext, isClient } from "@/lib/auth";

export interface SettingsFormState {
  error: string | null;
  ok?: boolean;
}

/** Campos que o PRÓPRIO cliente pode editar (comercial/integrações são da agência). */
const settingsSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da marca.").max(120),
  business_name: z.string().trim().min(2, "Informe a razão social.").max(160),
  niche: z.string().trim().max(80).optional().or(z.literal("")),
  contact_name: z.string().trim().max(120).optional().or(z.literal("")),
  contact_email: z.email("E-mail inválido.").optional().or(z.literal("")),
  contact_phone: z.string().trim().max(40).optional().or(z.literal("")),
  agent_prompt: z.string().trim().max(8000).optional().or(z.literal("")),
  agent_active: z.boolean(),
});

export async function updateClientSettingsAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const ctx = await getSessionContext();
  if (!ctx || !isClient(ctx.appUser) || !ctx.client) return { error: "Sessão expirada." };

  const parsed = settingsSchema.safeParse({
    ...Object.fromEntries(formData),
    agent_active: formData.get("agent_active") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const d = parsed.data;
  const nul = (v: string | undefined) => (v && v.length > 0 ? v : null);

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      name: d.name,
      business_name: d.business_name,
      niche: nul(d.niche),
      contact_name: nul(d.contact_name),
      contact_email: nul(d.contact_email),
      contact_phone: nul(d.contact_phone),
      agent_prompt: nul(d.agent_prompt),
      agent_active: d.agent_active,
    })
    .eq("id", ctx.client.id);
  if (error) return { error: "Não foi possível salvar. Tente novamente." };

  revalidatePath("/client/settings");
  revalidatePath("/client/dashboard");
  return { error: null, ok: true };
}
