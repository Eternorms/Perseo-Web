"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { leadCaptureSchema } from "@/lib/validation/public";

export interface LeadCaptureState {
  ok: boolean;
  error: string | null;
}

/** Backoff entre tentativas — absorve rejeições intermitentes de JWT do gateway da Supabase. */
const RETRY_DELAYS_MS = [300, 800];

async function writeLead(input: {
  brand: string;
  name: string;
  email: string;
  whatsapp: string;
  revenue: string;
  instagram?: string;
}) {
  const admin = createAdminClient();
  const { brand, name, email, whatsapp, revenue, instagram } = input;

  // idempotência simples: mesmo e-mail em onboarding não duplica
  const { data: existing } = await admin
    .from("clients")
    .select("id")
    .eq("contact_email", email)
    .eq("status", "onboarding")
    .maybeSingle();
  if (existing) return;

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

  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      await writeLead(parsed.data);

      // Notifica automação (n8n) — fire-and-forget, nunca bloqueia nem quebra a resposta ao lead.
      // No-op se a env var não estiver configurada.
      if (process.env.N8N_LEAD_WEBHOOK_URL) {
        fetch(process.env.N8N_LEAD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: parsed.data.name,
            email: parsed.data.email,
            mensagem: `Marca: ${parsed.data.brand} · WhatsApp: ${parsed.data.whatsapp} · Faturamento: ${parsed.data.revenue}${parsed.data.instagram ? ` · IG: ${parsed.data.instagram}` : ""}`,
          }),
        }).catch(() => {});
      }

      return { ok: true, error: null };
    } catch (err) {
      lastError = err;
      const delay = RETRY_DELAYS_MS[attempt];
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.error("[captureLeadAction] falha ao gravar lead após retries:", lastError);
  return { ok: false, error: "Não foi possível enviar agora. Tente novamente em instantes." };
}
