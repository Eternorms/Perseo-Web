import { z } from "zod";

export const TOTAL_STEPS = 7;

export const step1Schema = z.object({
  name: z.string().trim().min(2, "Informe o nome da marca."),
  business_name: z.string().trim().min(2, "Informe a razão social."),
  niche: z.string().trim().max(80).optional().or(z.literal("")),
  contact_name: z.string().trim().min(2, "Informe o nome do contato principal."),
  contact_email: z.email("E-mail do contato inválido."),
  contact_phone: z.string().trim().min(8, "Telefone do contato inválido."),
});

export const step2Schema = z
  .object({
    whatsapp_type: z.enum(["evolution", "meta"], { error: "Escolha o tipo de integração." }),
    whatsapp_instance: z.string().trim().optional().or(z.literal("")),
    whatsapp_phone: z.string().trim().min(8, "Número de WhatsApp inválido."),
  })
  .refine((v) => v.whatsapp_type !== "evolution" || (v.whatsapp_instance ?? "").length > 0, {
    message: "Informe o nome da instância Evolution.",
    path: ["whatsapp_instance"],
  });

export const step3Schema = z.object({
  meta_page_id: z.string().trim().max(64).optional().or(z.literal("")),
  meta_form_id: z.string().trim().max(64).optional().or(z.literal("")),
  ig_page_id: z.string().trim().max(64).optional().or(z.literal("")),
  meta_token: z.string().trim().max(512).optional().or(z.literal("")),
});

export const step4Schema = z.object({
  calendar_id: z.string().trim().max(256).optional().or(z.literal("")),
});

export const step5Schema = z.object({
  agent_prompt: z.string().trim().max(8000).optional().or(z.literal("")),
  agent_active: z.boolean(),
});

export const step6Schema = z.object({
  services: z.array(z.enum(["traffic", "content"])).min(1, "Selecione ao menos um serviço."),
});

/** Steps 2–5 são integrações configuráveis depois; 1 e 6 são obrigatórios. */
export const SKIPPABLE_STEPS = new Set([2, 3, 4, 5]);

export const STEP_TITLES: Record<number, { title: string; subtitle: string }> = {
  1: { title: "Dados da marca", subtitle: "Quem é a marca e quem responde por ela." },
  2: { title: "WhatsApp", subtitle: "Canal de atendimento e follow-up dos seus leads." },
  3: { title: "Meta Ads", subtitle: "Conexão com página, formulário de leads e Instagram." },
  4: { title: "Google Calendar", subtitle: "Agenda usada para marcar os atendimentos." },
  5: { title: "Agente de IA", subtitle: "Como o agente fala com seus leads — tom, regras e limites." },
  6: { title: "Serviços", subtitle: "O que a Perseo opera para sua marca." },
  7: { title: "Revisão", subtitle: "Confira tudo antes de ativar a operação." },
};
