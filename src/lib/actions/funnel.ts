"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/auth";
import { funnelStagesSchema } from "@/lib/validation/crm";
import type { FormState } from "./clients";

/**
 * Salva o conjunto de etapas customizadas do funil de um cliente
 * (substituição atômica: delete + insert na mesma ordem enviada).
 */
export async function saveFunnelStagesAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAgency();

  let stages: unknown;
  try {
    stages = JSON.parse((formData.get("stages") as string) ?? "[]");
  } catch {
    return { error: "Payload inválido." };
  }

  const parsed = funnelStagesSchema.safeParse({
    client_id: formData.get("client_id"),
    stages,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const values = parsed.data.stages.map((s) => s.value);
  if (new Set(values).size !== values.length) return { error: "Etapas com identificador duplicado." };

  const supabase = await createClient();
  const { error: delError } = await supabase.from("funnel_stages").delete().eq("client_id", parsed.data.client_id);
  if (delError) return { error: "Não foi possível salvar o funil." };

  const { error } = await supabase.from("funnel_stages").insert(
    parsed.data.stages.map((s, i) => ({
      client_id: parsed.data.client_id,
      value: s.value,
      label: s.label,
      color: s.color || null,
      position: i,
    })),
  );
  if (error) return { error: "Não foi possível salvar o funil." };

  revalidatePath("/agency/funis");
  return { error: null, ok: true };
}
