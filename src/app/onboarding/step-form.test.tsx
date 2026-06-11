import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/actions/onboarding", () => ({
  saveOnboardingStepAction: vi.fn(async () => ({ error: null })),
  skipOnboardingStepAction: vi.fn(async () => {}),
  finishOnboardingAction: vi.fn(async () => ({ error: null })),
}));

import { StepForm } from "./step-form";
import type { ClientRow } from "@/types/database";

const client: ClientRow = {
  id: "c1",
  name: "Vora",
  business_name: "Vora LTDA",
  niche: "skincare",
  status: "onboarding",
  onboarding_step: 6,
  whatsapp_type: "evolution",
  whatsapp_instance: "vora",
  whatsapp_phone: "+5511999999999",
  meta_page_id: null,
  meta_form_id: null,
  ig_page_id: null,
  meta_token: null,
  calendar_id: null,
  perseo_client_id: null,
  agent_prompt: null,
  agent_active: false,
  plan: "starter",
  services: ["traffic"],
  monthly_value: null,
  contact_name: "Marina",
  contact_phone: "+5511999999999",
  contact_email: "m@vora.com",
  intake: null,
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
};

describe("Onboarding StepForm (smoke)", () => {
  it("step 1 mostra os dados da marca obrigatórios", () => {
    render(<StepForm step={1} client={client} />);
    expect(screen.getByLabelText("Nome da marca")).toBeRequired();
    expect(screen.getByLabelText("Razão social")).toBeRequired();
    expect(screen.getByLabelText("E-mail")).toBeRequired();
    expect(screen.getByRole("button", { name: /continuar/i })).toBeInTheDocument();
    // step obrigatório não oferece "Configurar depois"
    expect(screen.queryByRole("button", { name: /configurar depois/i })).not.toBeInTheDocument();
  });

  it("steps de integração (2–5) permitem configurar depois", () => {
    render(<StepForm step={3} client={client} />);
    expect(screen.getByRole("button", { name: /configurar depois/i })).toBeInTheDocument();
  });

  it("step 7 revisa os dados e ativa a operação", () => {
    render(<StepForm step={7} client={client} />);
    expect(screen.getByText("Vora LTDA")).toBeInTheDocument();
    expect(screen.getByText(/tráfego/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ativar operação/i })).toBeInTheDocument();
  });
});
