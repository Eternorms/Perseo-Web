"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { leadCaptureSchema } from "@/lib/validation/public";

export interface LeadCaptureState {
  ok: boolean;
  error: string | null;
}

/**
 * Captura de lead do site público → cria `clients` em onboarding.
 * Roda com service role (visitante anônimo não tem sessão); validação zod
 * + honeypot. Nunca expõe detalhes internos no erro.
 */
export async function captureLeadAction(_prev: LeadCaptureState, formData: FormData): Promise<LeadCaptureState> {
  const parsed = leadCaptureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  }
  // honeypot preenchido → finge sucesso e descarta
  if (parsed.data.website && parsed.data.website.length > 0) {
    return { ok: true, error: null };
  }

  try {
    const admin = createAdminClient();
    const { brand, name, email, whatsapp, revenue, instagram } = parsed.data;

    // idempotência simples: mesmo e-mail em onboarding não duplica
    const { data: existing } = await admin
      .from("clients")
      .select("id")
      .eq("contact_email", email)
      .eq("status", "onboarding")
      .maybeSingle();
    if (existing) return { ok: true, error: null };

    const { error } = await admin.from("clients").insert({
      name: brand,
      business_name: brand,
      status: "onboarding",
      onboarding_step: 1,
      contact_name: name,
      contact_email: email,
      contact_phone: whatsapp,
      intake: {
        source: "landing",
        revenue_band: revenue,
        instagram: instagram || null,
        captured_at: new Date().toISOString(),
      },
    });
    if (error) throw error;
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: "Não foi possível enviar agora. Tente novamente em instantes." };
  }
}
