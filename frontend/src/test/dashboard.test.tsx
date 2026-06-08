import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "@/app/(agency)/agency/dashboard/page";

// Mock next/link para evitar erros de Router context
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const MOCK_CLIENTS = [
  {
    id: 1, name: "João", brand: "Marca A", niche: "E-commerce",
    plan: "Standard", stage: "active", active: 1,
    plan_value: 3000, monthly_budget: 5000,
    current_roas: null, current_cpa: null,
    client_email: null, client_whatsapp: null,
    last_contact_at: null, created_at: "2026-01-01",
  },
  {
    id: 2, name: "Maria", brand: "Marca B", niche: "Saúde",
    plan: "Premium", stage: "prospect", active: 1,
    plan_value: 5000, monthly_budget: 8000,
    current_roas: null, current_cpa: null,
    client_email: null, client_whatsapp: null,
    last_contact_at: null, created_at: "2026-02-01",
  },
];

const MOCK_APPROVALS = [
  {
    id: 1, client_id: 1, video_id: null,
    title: "Anúncio Teste", description: null,
    media_url: "https://example.com/v.mp4", thumbnail_url: null,
    status: "pending" as const, client_feedback: null,
    submitted_at: "2026-06-01", decided_at: null,
    brand: "Marca A", client_name: "João",
  },
];

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn((path: string) => {
      if (path.includes("clients")) return Promise.resolve(MOCK_CLIENTS);
      if (path.includes("approvals")) return Promise.resolve(MOCK_APPROVALS);
      if (path.includes("tasks")) return Promise.resolve([]);
      return Promise.resolve([]);
    }),
    post: vi.fn(() => Promise.resolve({ ok: true })),
    patch: vi.fn(() => Promise.resolve({ ok: true })),
  },
}));

describe("DashboardPage", () => {
  it("renderiza o título Dashboard", async () => {
    render(<DashboardPage />);
    expect(screen.getByText("Dashboard")).toBeDefined();
  });

  it("exibe MRR calculado a partir dos clientes ativos", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      // MRR = 3000 + 5000 = 8000 (ambos não são churned)
      expect(screen.getByText(/8\.000|8000/)).toBeDefined();
    });
  });

  it("exibe contagem de clientes ativos", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      // 2 clientes, stage active + prospect (nenhum churned)
      const cards = screen.getAllByText("2");
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  it("exibe aprovações pendentes quando existem", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("aprovações")).toBeDefined();
    });
  });

  it("exibe o pipeline strip com os stages", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Prospect")).toBeDefined();
      expect(screen.getByText("Ativo")).toBeDefined();
      expect(screen.getByText("Churn")).toBeDefined();
    });
  });

  it("exibe tabela de clientes com brands", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getAllByText("Marca A").length).toBeGreaterThan(0);
      expect(screen.getByText("Marca B")).toBeDefined();
    });
  });
});
