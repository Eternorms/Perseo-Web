import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/actions/clients", () => ({
  updateClientAction: vi.fn(async () => ({ error: null })),
  deleteClientAction: vi.fn(async () => {}),
}));

import { ClientEditForm } from "./client-edit-form";
import type { ClientRow } from "@/types/database";

const client: ClientRow = {
  id: "c1",
  name: "Vora",
  business_name: "Vora LTDA",
  niche: null,
  status: "active",
  onboarding_step: 7,
  whatsapp_type: null,
  whatsapp_instance: null,
  whatsapp_phone: null,
  meta_page_id: null,
  meta_form_id: null,
  ig_page_id: null,
  meta_token: null,
  calendar_id: null,
  perseo_client_id: 42,
  agent_prompt: null,
  agent_active: true,
  plan: "growth",
  services: ["traffic", "content"],
  monthly_value: 9500,
  contact_name: null,
  contact_phone: null,
  contact_email: null,
  intake: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("ClientEditForm (smoke — ponte perseo)", () => {
  it("expõe o campo da ponte perseo_client_id preenchido", () => {
    render(<ClientEditForm client={client} canDelete={false} />);
    const bridge = screen.getByLabelText(/perseo_client_id/i);
    expect(bridge).toHaveValue(42);
  });

  it("exclusão de cliente só aparece para o owner", () => {
    const { rerender } = render(<ClientEditForm client={client} canDelete={false} />);
    expect(screen.queryByRole("button", { name: /excluir cliente/i })).not.toBeInTheDocument();
    rerender(<ClientEditForm client={client} canDelete />);
    expect(screen.getByRole("button", { name: /excluir cliente/i })).toBeInTheDocument();
  });
});
