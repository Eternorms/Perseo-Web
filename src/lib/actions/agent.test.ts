import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Ciclo de solicitações ao agente: cliente solicita apenas sobre os próprios
 * agendamentos; transições de status são restritas à agência e validadas.
 */

const appointmentLookup = { maybeSingle: vi.fn() };
const actionInsert = vi.fn();
const notifInsert = vi.fn();
const actionStatusLookup = { maybeSingle: vi.fn() };
const actionUpdate = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  getSessionContext: vi.fn(),
  isAgency: (u: { user_type: string }) => u.user_type.startsWith("agency"),
  requireAgency: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === "appointments") {
        return { select: () => ({ eq: () => ({ eq: () => appointmentLookup }) }) };
      }
      if (table === "agent_actions") {
        return {
          insert: actionInsert,
          select: () => ({ eq: () => actionStatusLookup }),
          update: actionUpdate,
        };
      }
      if (table === "client_notifications") {
        return { insert: notifInsert };
      }
      throw new Error(`tabela inesperada: ${table}`);
    },
  }),
}));

import { requestAgentActionAction, updateAgentActionStatusAction } from "./agent";
import { getSessionContext, requireAgency } from "@/lib/auth";

const mockedSession = vi.mocked(getSessionContext);
const APPT_ID = "11111111-1111-4111-8111-111111111111";

function clientSession() {
  return {
    appUser: { id: "u1", user_type: "client_owner", client_id: "c1" },
    client: { id: "c1", name: "Vora" },
  } as never;
}

function formData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  appointmentLookup.maybeSingle.mockResolvedValue({
    data: { id: APPT_ID, patient_name: "Ana", scheduled_at: "2027-01-10T14:00:00Z" },
  });
  actionInsert.mockResolvedValue({ error: null });
  notifInsert.mockResolvedValue({ error: null });
  actionUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
});

describe("requestAgentActionAction", () => {
  it("cliente cria reschedule do próprio agendamento + notificação de confirmação", async () => {
    mockedSession.mockResolvedValue(clientSession());
    const result = await requestAgentActionAction(
      { error: null },
      formData({ action_type: "reschedule", appointment_id: APPT_ID, preferred_at: "2030-01-15T10:00" }),
    );

    expect(result.ok).toBe(true);
    expect(actionInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: "c1",
        action_type: "reschedule",
        requested_by: "u1",
        payload: expect.objectContaining({ appointment_id: APPT_ID, patient_name: "Ana" }),
      }),
    );
    expect(notifInsert).toHaveBeenCalledWith(expect.objectContaining({ client_id: "c1", type: "agent_request" }));
  });

  it("reschedule exige data futura", async () => {
    mockedSession.mockResolvedValue(clientSession());
    const result = await requestAgentActionAction(
      { error: null },
      formData({ action_type: "reschedule", appointment_id: APPT_ID, preferred_at: "2020-01-01T10:00" }),
    );
    expect(result.error).toMatch(/futuro/i);
    expect(actionInsert).not.toHaveBeenCalled();
  });

  it("agendamento de outro cliente → não encontrado", async () => {
    mockedSession.mockResolvedValue(clientSession());
    appointmentLookup.maybeSingle.mockResolvedValue({ data: null });
    const result = await requestAgentActionAction(
      { error: null },
      formData({ action_type: "cancel_appointment", appointment_id: APPT_ID }),
    );
    expect(result.error).toMatch(/não encontrado/i);
    expect(actionInsert).not.toHaveBeenCalled();
  });

  it("tipo fora do permitido ao cliente (qualify_lead) é rejeitado", async () => {
    mockedSession.mockResolvedValue(clientSession());
    const result = await requestAgentActionAction(
      { error: null },
      formData({ action_type: "qualify_lead", appointment_id: APPT_ID }),
    );
    expect(result.error).toBeTruthy();
    expect(actionInsert).not.toHaveBeenCalled();
  });
});

describe("updateAgentActionStatusAction", () => {
  it("agência move pending → approved", async () => {
    actionStatusLookup.maybeSingle.mockResolvedValue({ data: { status: "pending" } });
    await updateAgentActionStatusAction(formData({ id: "a1", status: "approved" }));
    expect(requireAgency).toHaveBeenCalled();
    expect(actionUpdate).toHaveBeenCalledWith({ status: "approved" });
  });

  it("transição inválida (pending → executed) é ignorada", async () => {
    actionStatusLookup.maybeSingle.mockResolvedValue({ data: { status: "pending" } });
    await updateAgentActionStatusAction(formData({ id: "a1", status: "executed" }));
    expect(actionUpdate).not.toHaveBeenCalled();
  });
});
