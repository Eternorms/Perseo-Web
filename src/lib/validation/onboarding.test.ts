import { describe, expect, it } from "vitest";
import { step1Schema, step2Schema, step6Schema, SKIPPABLE_STEPS } from "./onboarding";
import { safeInternalPath } from "./auth";
import { leadCaptureSchema } from "./public";

describe("onboarding — step 1 (dados da marca)", () => {
  it("aceita dados completos", () => {
    const r = step1Schema.safeParse({
      name: "Vora",
      business_name: "Vora LTDA",
      niche: "skincare",
      contact_name: "Marina",
      contact_email: "m@vora.com",
      contact_phone: "+5511999999999",
    });
    expect(r.success).toBe(true);
  });
  it("rejeita e-mail inválido", () => {
    const r = step1Schema.safeParse({
      name: "Vora",
      business_name: "Vora LTDA",
      contact_name: "Marina",
      contact_email: "nope",
      contact_phone: "+5511999999999",
    });
    expect(r.success).toBe(false);
  });
});

describe("onboarding — step 2 (WhatsApp)", () => {
  it("evolution exige instância", () => {
    const r = step2Schema.safeParse({ whatsapp_type: "evolution", whatsapp_instance: "", whatsapp_phone: "+5511988887777" });
    expect(r.success).toBe(false);
  });
  it("meta não exige instância", () => {
    const r = step2Schema.safeParse({ whatsapp_type: "meta", whatsapp_phone: "+5511988887777" });
    expect(r.success).toBe(true);
  });
});

describe("onboarding — step 6 (serviços)", () => {
  it("exige ao menos um serviço", () => {
    expect(step6Schema.safeParse({ services: [] }).success).toBe(false);
    expect(step6Schema.safeParse({ services: ["traffic"] }).success).toBe(true);
  });
});

describe("onboarding — steps puláveis", () => {
  it("apenas integrações (2–5) podem ser puladas", () => {
    expect([...SKIPPABLE_STEPS].sort()).toEqual([2, 3, 4, 5]);
  });
});

describe("safeInternalPath — anti open-redirect", () => {
  it("aceita caminhos internos", () => {
    expect(safeInternalPath("/client/dashboard", "/x")).toBe("/client/dashboard");
  });
  it("rejeita URLs externas e protocol-relative", () => {
    expect(safeInternalPath("https://evil.com", "/x")).toBe("/x");
    expect(safeInternalPath("//evil.com", "/x")).toBe("/x");
    expect(safeInternalPath(null, "/x")).toBe("/x");
  });
});

describe("captura de lead da landing", () => {
  it("aceita lead válido", () => {
    const r = leadCaptureSchema.safeParse({
      brand: "Vora",
      name: "Marina",
      email: "m@vora.com",
      whatsapp: "+5511999999999",
      revenue: "50k–150k",
      instagram: "@vora",
      website: "",
    });
    expect(r.success).toBe(true);
  });
  it("honeypot preenchido falha a validação de tamanho zero", () => {
    const r = leadCaptureSchema.safeParse({
      brand: "Vora",
      name: "Bot",
      email: "bot@spam.com",
      whatsapp: "+5511999999999",
      revenue: "50k–150k",
      website: "http://spam.com",
    });
    expect(r.success).toBe(false);
  });
});
