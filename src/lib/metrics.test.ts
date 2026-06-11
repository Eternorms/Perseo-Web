import { describe, expect, it } from "vitest";
import { adjustedRoas, aggregateResults, buildFunnel, computeMrr, deltaPct } from "./metrics";
import type { CampaignResultRow } from "@/types/perseo";

function row(partial: Partial<CampaignResultRow>): CampaignResultRow {
  return {
    id: 1,
    client_id: 1,
    video_id: null,
    date: null,
    roas: null,
    cpa: null,
    hook_rate: null,
    spend: null,
    impressions: null,
    clicks: null,
    fraud_rate: null,
    fraud_clicks: null,
    ...partial,
  };
}

describe("adjustedRoas — regra: ROAS exibido é sempre ajustado por fraude", () => {
  it("aplica ROAS × (1 − fraud_rate/100)", () => {
    expect(adjustedRoas(3.4, 12)).toBeCloseTo(2.992, 3);
  });
  it("sem fraude, mantém o ROAS", () => {
    expect(adjustedRoas(2.5, null)).toBe(2.5);
    expect(adjustedRoas(2.5, 0)).toBe(2.5);
  });
  it("fraude acima de 100% satura em zero (não fica negativo)", () => {
    expect(adjustedRoas(3, 140)).toBe(0);
  });
  it("sem ROAS retorna null", () => {
    expect(adjustedRoas(null, 10)).toBeNull();
  });
});

describe("aggregateResults — média ponderada por spend", () => {
  it("pondera ROAS e fraude pelo investimento", () => {
    const agg = aggregateResults([
      row({ roas: 4, spend: 300, fraud_rate: 10 }),
      row({ roas: 1, spend: 100, fraud_rate: 30 }),
    ]);
    // roas = (4*300 + 1*100)/400 = 3.25 ; fraude = (10*300+30*100)/400 = 15
    expect(agg.roas).toBeCloseTo(3.25, 4);
    expect(agg.fraudRate).toBeCloseTo(15, 4);
    expect(agg.adjustedRoas).toBeCloseTo(3.25 * 0.85, 4);
    expect(agg.spend).toBe(400);
  });
  it("hook rate pondera por impressões", () => {
    const agg = aggregateResults([
      row({ hook_rate: 40, impressions: 1000, spend: 1 }),
      row({ hook_rate: 20, impressions: 3000, spend: 1 }),
    ]);
    expect(agg.hookRate).toBeCloseTo(25, 4);
  });
  it("vazio → nulls e zeros", () => {
    const agg = aggregateResults([]);
    expect(agg.roas).toBeNull();
    expect(agg.adjustedRoas).toBeNull();
    expect(agg.spend).toBe(0);
  });
});

describe("buildFunnel — funil cumulativo new→converted", () => {
  it("etapas posteriores contam nas anteriores e calcula conversões", () => {
    const funnel = buildFunnel({ new: 4, contacted: 3, qualified: 2, scheduled: 0, converted: 1, lost: 5 });
    // cumulativo: new=10, contacted=6, qualified=3, scheduled=1, converted=1
    expect(funnel.map((s) => s.count)).toEqual([10, 6, 3, 1, 1]);
    expect(funnel[1].conversionFromPrev).toBeCloseTo(60, 4);
    expect(funnel[4].conversionFromTop).toBeCloseTo(10, 4);
    expect(funnel[0].conversionFromPrev).toBeNull();
  });
  it("lost não entra no fluxo principal", () => {
    const funnel = buildFunnel({ lost: 7 });
    expect(funnel[0].count).toBe(0);
  });
});

describe("computeMrr", () => {
  it("soma apenas ativos e calcula churn", () => {
    const snap = computeMrr([
      { status: "active", monthly_value: 9000 },
      { status: "active", monthly_value: 12000 },
      { status: "paused", monthly_value: 5000 },
      { status: "churned", monthly_value: 8000 },
      { status: "onboarding", monthly_value: null },
    ]);
    expect(snap.mrr).toBe(21000);
    expect(snap.activeClients).toBe(2);
    expect(snap.avgTicket).toBe(10500);
    expect(snap.churnedValue).toBe(8000);
    expect(snap.churnRatePct).toBeCloseTo(33.333, 2);
  });
});

describe("deltaPct", () => {
  it("variação percentual entre períodos", () => {
    expect(deltaPct(130, 100)).toBeCloseTo(30, 4);
    expect(deltaPct(70, 100)).toBeCloseTo(-30, 4);
  });
  it("sem base de comparação → null", () => {
    expect(deltaPct(10, 0)).toBeNull();
    expect(deltaPct(10, null)).toBeNull();
  });
});
