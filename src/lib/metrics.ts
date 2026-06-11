/**
 * Cálculos de negócio puros (testáveis sem DB).
 */

import type { CampaignResultRow } from "@/types/perseo";
import type { LeadStatus } from "@/types/database";

/**
 * ROAS ajustado por fraude — regra de negócio: ROAS exibido é SEMPRE
 * o ajustado quando houver fraud_rate.  ROAS × (1 − fraud_rate/100).
 */
export function adjustedRoas(roas: number | null | undefined, fraudRate: number | null | undefined): number | null {
  if (roas == null || Number.isNaN(roas)) return null;
  if (fraudRate == null || Number.isNaN(fraudRate) || fraudRate <= 0) return roas;
  const clamped = Math.min(Math.max(fraudRate, 0), 100);
  return roas * (1 - clamped / 100);
}

export interface AggregatedResults {
  spend: number;
  impressions: number;
  clicks: number;
  fraudClicks: number;
  /** média ponderada por spend */
  roas: number | null;
  adjustedRoas: number | null;
  cpa: number | null;
  hookRate: number | null;
  fraudRate: number | null;
}

/** Agrega linhas de perseo.campaign_results em um snapshot ponderado por spend. */
export function aggregateResults(rows: CampaignResultRow[]): AggregatedResults {
  let spend = 0;
  let impressions = 0;
  let clicks = 0;
  let fraudClicks = 0;
  let roasW = 0;
  let cpaW = 0;
  let cpaSpend = 0;
  let hookW = 0;
  let hookImp = 0;
  let fraudW = 0;
  let fraudSpend = 0;
  let roasSpend = 0;

  for (const r of rows) {
    const s = r.spend ?? 0;
    spend += s;
    impressions += r.impressions ?? 0;
    clicks += r.clicks ?? 0;
    fraudClicks += r.fraud_clicks ?? 0;
    if (r.roas != null && s > 0) {
      roasW += r.roas * s;
      roasSpend += s;
    }
    if (r.cpa != null && s > 0) {
      cpaW += r.cpa * s;
      cpaSpend += s;
    }
    if (r.hook_rate != null && (r.impressions ?? 0) > 0) {
      hookW += r.hook_rate * (r.impressions ?? 0);
      hookImp += r.impressions ?? 0;
    }
    if (r.fraud_rate != null && s > 0) {
      fraudW += r.fraud_rate * s;
      fraudSpend += s;
    }
  }

  const roas = roasSpend > 0 ? roasW / roasSpend : null;
  const fraudRate = fraudSpend > 0 ? fraudW / fraudSpend : null;

  return {
    spend,
    impressions,
    clicks,
    fraudClicks,
    roas,
    adjustedRoas: adjustedRoas(roas, fraudRate),
    cpa: cpaSpend > 0 ? cpaW / cpaSpend : null,
    hookRate: hookImp > 0 ? hookW / hookImp : null,
    fraudRate,
  };
}

/** Δ percentual entre período atual e anterior. null quando não comparável. */
export function deltaPct(current: number | null | undefined, previous: number | null | undefined): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export const FUNNEL_ORDER: LeadStatus[] = ["new", "contacted", "qualified", "scheduled", "converted"];

export interface FunnelStep {
  status: LeadStatus;
  count: number;
  /** conversão da etapa anterior para esta (0–100), null na primeira */
  conversionFromPrev: number | null;
  /** conversão acumulada desde o topo (0–100) */
  conversionFromTop: number | null;
}

/**
 * Funil cumulativo: um lead em `converted` também conta nas etapas anteriores
 * (passou por elas). `lost` fica fora do fluxo principal.
 */
export function buildFunnel(counts: Partial<Record<LeadStatus, number>>): FunnelStep[] {
  const idx = (s: LeadStatus) => FUNNEL_ORDER.indexOf(s);
  const cumulative = FUNNEL_ORDER.map((status) =>
    FUNNEL_ORDER.reduce((acc, s) => (idx(s) >= idx(status) ? acc + (counts[s] ?? 0) : acc), 0),
  );
  const top = cumulative[0] ?? 0;
  return FUNNEL_ORDER.map((status, i) => {
    const count = cumulative[i];
    const prev = i === 0 ? null : cumulative[i - 1];
    return {
      status,
      count,
      conversionFromPrev: prev == null ? null : prev > 0 ? (count / prev) * 100 : null,
      conversionFromTop: i === 0 ? null : top > 0 ? (count / top) * 100 : null,
    };
  });
}

export interface MrrSnapshot {
  mrr: number;
  activeClients: number;
  avgTicket: number | null;
  churnedValue: number;
  churnRatePct: number | null;
}

/** MRR a partir de clients.monthly_value por status. */
export function computeMrr(
  clients: Array<{ status: string; monthly_value: number | null }>,
): MrrSnapshot {
  let mrr = 0;
  let active = 0;
  let churnedValue = 0;
  let churnedCount = 0;
  for (const c of clients) {
    if (c.status === "active") {
      active += 1;
      mrr += c.monthly_value ?? 0;
    } else if (c.status === "churned") {
      churnedCount += 1;
      churnedValue += c.monthly_value ?? 0;
    }
  }
  const denom = active + churnedCount;
  return {
    mrr,
    activeClients: active,
    avgTicket: active > 0 ? mrr / active : null,
    churnedValue,
    churnRatePct: denom > 0 ? (churnedCount / denom) * 100 : null,
  };
}
