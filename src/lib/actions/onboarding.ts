"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOnboarding } from "@/lib/auth";
import {
  SKIPPABLE_STEPS,
  TOTAL_STEPS,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
} from "@/lib/validation/onboarding";
import type { ClientRow } from "@/types/database";

export interface OnboardingFormState {
  error: string | null;
}

const empty = (v: string | undefined) => (v && v.length > 0 ? v : null);

function parseStep(step: number, formData: FormData): { data: Partial<ClientRow> } | { error: string } {
  switch (step) {
    case 1: {
      const p = step1Schema.safeParse(Object.fromEntries(formData));
      if (!p.success) return { error: p.error.issues[0]?.message ?? "Dados inválidos." };
      return {
        data: {
          name: p.data.name,
          business_name: p.data.business_name,
          niche: empty(p.data.niche),
          contact_name: p.data.contact_name,
          contact_email: p.data.contact_email,
          contact_phone: p.data.contact_phone,
        },
      };
    }
    case 2: {
      const p = step2Schema.safeParse(Object.fromEntries(formData));
      if (!p.success) return { error: p.error.issues[0]?.message ?? "Dados inválidos." };
      return {
        data: {
          whatsapp_type: p.data.whatsapp_type,
          whatsapp_instance: empty(p.data.whatsapp_instance),
          whatsapp_phone: p.data.whatsapp_phone,
        },
      };
    }
    case 3: {
      const p = step3Schema.safeParse(Object.fromEntries(formData));
      if (!p.success) return { error: p.error.issues[0]?.message ?? "Dados inválidos." };
      return {
        data: {
          meta_page_id: empty(p.data.meta_page_id),
          meta_form_id: empty(p.data.meta_form_id),
          ig_page_id: empty(p.data.ig_page_id),
          meta_token: empty(p.data.meta_token),
        },
      };
    }
    case 4: {
      const p = step4Schema.safeParse(Object.fromEntries(formData));
      if (!p.success) return { error: p.error.issues[0]?.message ?? "Dados inválidos." };
      return { data: { calendar_id: empty(p.data.calendar_id) } };
    }
    case 5: {
      const p = step5Schema.safeParse({
        agent_prompt: formData.get("agent_prompt") ?? "",
        agent_active: formData.get("agent_active") === "on",
      });
      if (!p.success) return { error: p.error.issues[0]?.message ?? "Dados inválidos." };
      return { data: { agent_prompt: empty(p.data.agent_prompt), agent_active: p.data.agent_active } };
    }
    case 6: {
      const p = step6Schema.safeParse({ services: formData.getAll("services") });
      if (!p.success) return { error: p.error.issues[0]?.message ?? "Dados inválidos." };
      return { data: { services: p.data.services } };
    }
    default:
      return { error: "Step inválido." };
  }
}

export async function saveOnboardingStepAction(
  _prev: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const step = Number(formData.get("step"));
  if (!Number.isInteger(step) || step < 1 || step >= TOTAL_STEPS) return { error: "Step inválido." };

  const { client } = await requireOnboarding();
  const parsed = parseStep(step, formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const nextStep = Math.min(Math.max(client.onboarding_step, step + 1), TOTAL_STEPS);
  const { error } = await supabase
    .from("clients")
    .update({ ...parsed.data, onboarding_step: nextStep })
    .eq("id", client.id);
  if (error) return { error: "Não foi possível salvar. Tente novamente." };

  revalidatePath("/onboarding");
  redirect(`/onboarding?step=${step + 1}`);
}

export async function skipOnboardingStepAction(formData: FormData): Promise<void> {
  const step = Number(formData.get("step"));
  if (!SKIPPABLE_STEPS.has(step)) redirect("/onboarding");

  const { client } = await requireOnboarding();
  const supabase = await createClient();
  const nextStep = Math.min(Math.max(client.onboarding_step, step + 1), TOTAL_STEPS);
  await supabase.from("clients").update({ onboarding_step: nextStep }).eq("id", client.id);

  revalidatePath("/onboarding");
  redirect(`/onboarding?step=${step + 1}`);
}

export async function finishOnboardingAction(
  _prev: OnboardingFormState,
  _formData: FormData,
): Promise<OnboardingFormState> {
  const { client } = await requireOnboarding();

  // Regras mínimas para ativar: dados da marca + ao menos um serviço.
  if (!client.name || !client.contact_email) {
    return { error: "Complete o step 1 (dados da marca) antes de ativar." };
  }
  if (!client.services || client.services.length === 0) {
    return { error: "Selecione ao menos um serviço no step 6." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ status: "active", onboarding_step: TOTAL_STEPS })
    .eq("id", client.id);
  if (error) return { error: "Não foi possível concluir. Tente novamente." };

  await supabase.from("client_notifications").insert({
    client_id: client.id,
    type: "onboarding",
    title: "Onboarding concluído",
    body: "Sua operação está ativa. Bem-vindo à Perseo.",
  });

  revalidatePath("/client/dashboard");
  redirect("/client/dashboard");
}
