import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Smoke da ponte perseo: a decisão de criativo é a ÚNICA escrita permitida
 * no schema do engine — precisa validar autorização, exigir feedback em
 * revisão/rejeição, restringir ao perseo_client_id do cliente e notificar.
 */

const updateChain = {
  eq: vi.fn(),
  select: vi.fn(),
  maybeSingle: vi.fn(),
};
const perseoFrom = vi.fn();
const adminFrom = vi.fn();
const notifInsert = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  getSessionContext: vi.fn(),
  isAgency: (u: { user_type: string }) => u.user_type.startsWith("agency"),
  requireAgency: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  perseoDb: () => ({ from: perseoFrom }),
  createAdminClient: () => ({ from: adminFrom }),
  adminConfigured: () => true,
}));

import { decideCreativeAction } from "./creatives";
import { getSessionContext } from "@/lib/auth";

const mockedSession = vi.mocked(getSessionContext);

function clientSession(perseoClientId: number | null) {
  return {
    appUser: { id: "u1", user_type: "client_owner", client_id: "c1" },
    client: { id: "c1", perseo_client_id: perseoClientId, name: "Vora" },
  } as never;
}

function formData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  // encadeamento update().eq().eq().select().maybeSingle()
  updateChain.eq.mockReturnValue(updateChain);
  updateChain.select.mockReturnValue(updateChain);
  updateChain.maybeSingle.mockResolvedValue({ data: { id: 7, client_id: 42, title: "Hook POV" }, error: null });
  perseoFrom.mockReturnValue({ update: vi.fn().mockReturnValue(updateChain) });
  notifInsert.mockResolvedValue({ error: null });
  adminFrom.mockImplementation((table: string) =>
    table === "client_notifications"
      ? { insert: notifInsert }
      : { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: "c1" } }) }) }) },
  );
});

describe("decideCreativeAction", () => {
  it("cliente aprova criativo do próprio engine e gera notificação", async () => {
    mockedSession.mockResolvedValue(clientSession(42));
    const result = await decideCreativeAction({ error: null }, formData({ creative_id: "7", decision: "approved" }));

    expect(result.ok).toBe(true);
    // restringiu ao próprio perseo_client_id (eq id + eq client_id)
    expect(updateChain.eq).toHaveBeenCalledWith("id", 7);
    expect(updateChain.eq).toHaveBeenCalledWith("client_id", 42);
    expect(notifInsert).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: "c1", type: "creative_decision" }),
    );
  });

  it("revisão sem feedback é recusada", async () => {
    mockedSession.mockResolvedValue(clientSession(42));
    const result = await decideCreativeAction({ error: null }, formData({ creative_id: "7", decision: "revision", feedback: "" }));
    expect(result.ok).toBeUndefined();
    expect(result.error).toMatch(/feedback/i);
    expect(perseoFrom).not.toHaveBeenCalled();
  });

  it("cliente sem ponte perseo não escreve no engine", async () => {
    mockedSession.mockResolvedValue(clientSession(null));
    const result = await decideCreativeAction({ error: null }, formData({ creative_id: "7", decision: "approved" }));
    expect(result.error).toMatch(/engine/i);
    expect(perseoFrom).not.toHaveBeenCalled();
  });

  it("decisão inválida é rejeitada antes de tocar o banco", async () => {
    mockedSession.mockResolvedValue(clientSession(42));
    const result = await decideCreativeAction({ error: null }, formData({ creative_id: "7", decision: "pending" }));
    expect(result.error).toBeTruthy();
    expect(perseoFrom).not.toHaveBeenCalled();
  });

  it("criativo de outro cliente → não encontrado (0 linhas)", async () => {
    mockedSession.mockResolvedValue(clientSession(42));
    updateChain.maybeSingle.mockResolvedValue({ data: null, error: null });
    const result = await decideCreativeAction({ error: null }, formData({ creative_id: "99", decision: "approved" }));
    expect(result.error).toMatch(/não encontrado/i);
    expect(notifInsert).not.toHaveBeenCalled();
  });
});
