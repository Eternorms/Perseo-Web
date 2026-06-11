import { z } from "zod";

export const REVENUE_BANDS = ["<50k", "50k–150k", "150k–500k", ">500k"] as const;

export const leadCaptureSchema = z.object({
  brand: z.string().trim().min(2, "Informe o nome da marca.").max(120),
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  email: z.email("Informe um e-mail válido."),
  whatsapp: z.string().trim().min(8, "Informe um WhatsApp válido.").max(30),
  revenue: z.enum(REVENUE_BANDS, { error: "Selecione a faixa de faturamento." }),
  instagram: z.string().trim().max(120).optional().or(z.literal("")),
  // honeypot — humanos não preenchem
  website: z.string().max(0).optional().or(z.literal("")),
});

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;
