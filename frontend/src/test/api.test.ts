import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/api";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("api.get", () => {
  it("retorna o JSON parseado quando status é ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 1, brand: "Marca X" }]),
    }));

    const result = await api.get("/api/test");
    expect(result).toEqual([{ id: 1, brand: "Marca X" }]);
  });

  it("lança Error com a mensagem do backend quando status não é ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Not Found",
      json: () => Promise.resolve({ detail: "Recurso não encontrado" }),
    }));

    await expect(api.get("/api/inexistente")).rejects.toThrow("Recurso não encontrado");
  });

  it("usa statusText como fallback quando backend não retorna detail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Internal Server Error",
      json: () => Promise.reject(new Error("not json")),
    }));

    await expect(api.get("/api/erro")).rejects.toThrow("Internal Server Error");
  });
});

describe("api.post", () => {
  it("envia Content-Type application/json", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await api.post("/api/agency/clients", { name: "Teste" });

    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].headers["Content-Type"]).toBe("application/json");
    expect(callArgs[1].method).toBe("POST");
  });
});

describe("api.patch", () => {
  it("envia método PATCH com body serializado", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await api.patch("/api/agency/clients/1", { stage: "active" });

    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].method).toBe("PATCH");
    expect(callArgs[1].body).toBe(JSON.stringify({ stage: "active" }));
  });
});
