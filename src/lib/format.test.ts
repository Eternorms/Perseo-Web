import { describe, expect, it } from "vitest";
import { fmtCurrency, fmtDuration, fmtPercent, fmtRelative, fmtRoas, initials } from "./format";

describe("formatadores pt-BR", () => {
  it("moeda BRL", () => {
    expect(fmtCurrency(1234.5)).toMatch(/R\$\s?1\.234,50/);
    expect(fmtCurrency(null)).toBe("—");
  });
  it("ROAS multiplicador", () => {
    expect(fmtRoas(3.418)).toBe("3,42×");
    expect(fmtRoas(undefined)).toBe("—");
  });
  it("percentual já em escala 0–100", () => {
    expect(fmtPercent(12.34)).toBe("12,3%");
    expect(fmtPercent(0.5, { ofOne: true })).toBe("50%");
  });
  it("duração de resposta", () => {
    expect(fmtDuration(38)).toBe("38s");
    expect(fmtDuration(252)).toBe("4m 12s");
    expect(fmtDuration(3780)).toBe("1h 03m");
    expect(fmtDuration(null)).toBe("—");
  });
  it("tempo relativo", () => {
    const now = new Date("2026-06-11T12:00:00Z");
    expect(fmtRelative("2026-06-11T11:57:00Z", now)).toBe("há 3 min");
    expect(fmtRelative("2026-06-11T09:00:00Z", now)).toBe("há 3 h");
    expect(fmtRelative("2026-06-13T12:00:00Z", now)).toBe("em 2 d");
  });
  it("iniciais de avatar", () => {
    expect(initials("Loja Vora")).toBe("LV");
    expect(initials("perseo")).toBe("P");
    expect(initials(null)).toBe("?");
  });
});
