import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ClientsPage from "@/app/(agency)/agency/clients/page";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const MOCK_CLIENTS = [
  {
    id: 1, name: "João Silva", brand: "Marca Teste", niche: "E-commerce",
    plan: "Standard", stage: "active", active: 1,
    plan_value: 3000, monthly_budget: 5000,
    current_roas: 3.5, current_cpa: 25,
    client_email: null, client_whatsapp: null,
    last_contact_at: null, created_at: "2026-01-01",
  },
  {
    id: 2, name: "Maria Souza", brand: "Clinica MS", niche: "Estética",
    plan: "Premium", stage: "prospect", active: 1,
    plan_value: 5000, monthly_budget: 8000,
    current_roas: null, current_cpa: null,
    client_email: null, client_whatsapp: null,
    last_contact_at: null, created_at: "2026-02-01",
  },
];

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(() => Promise.resolve(MOCK_CLIENTS)),
    post: vi.fn(() => Promise.resolve({ id: 3 })),
    patch: vi.fn(() => Promise.resolve({ ok: true })),
  },
}));

describe("ClientsPage", () => {
  it("exibe a contagem de clientes cadastrados", async () => {
    render(<ClientsPage />);
    await waitFor(() => {
      expect(screen.getByText("2 clientes cadastrados")).toBeDefined();
    });
  });

  it("renderiza os cards de clientes com brands corretas", async () => {
    render(<ClientsPage />);
    await waitFor(() => {
      expect(screen.getByText("Marca Teste")).toBeDefined();
      expect(screen.getByText("Clinica MS")).toBeDefined();
    });
  });

  it("filtra clientes por busca de brand", async () => {
    render(<ClientsPage />);
    await waitFor(() => {
      expect(screen.getByText("Marca Teste")).toBeDefined();
    });

    const input = screen.getByPlaceholderText("Buscar marca, nome, nicho...");
    fireEvent.change(input, { target: { value: "Clinica" } });

    await waitFor(() => {
      expect(screen.queryByText("Marca Teste")).toBeNull();
      expect(screen.getByText("Clinica MS")).toBeDefined();
    });
  });

  it("exibe estágios com badges corretos", async () => {
    render(<ClientsPage />);
    await waitFor(() => {
      expect(screen.getByText("Ativo")).toBeDefined();
      expect(screen.getByText("Prospect")).toBeDefined();
    });
  });

  it("exibe botão de novo cliente", () => {
    render(<ClientsPage />);
    expect(screen.getByText("+ Novo Cliente")).toBeDefined();
  });

  it("abre modal ao clicar em Novo Cliente", async () => {
    render(<ClientsPage />);
    const btn = screen.getByText("+ Novo Cliente");
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText("Novo Cliente")).toBeDefined();
    });
  });
});
