import "server-only";

import { createClient } from "@/lib/supabase/server";
import { fetchCampaignResults, fetchCreativesForPerseoClients } from "@/lib/data/creatives";
import { adjustedRoas, aggregateResults, type AggregatedResults } from "@/lib/metrics";
import type { CampaignResultRow } from "@/types/perseo";

export interface BridgedClient {
  id: string;
  name: string;
  perseoId: number;
}

export interface CreativePerf {
  videoId: number;
  title: string;
  clientName: string;
  spend: number;
  impressions: number;
  hookRate: number | null;
  cpa: number | null;
  roas: number | null;
  adjRoas: number | null;
  fraudRate: number | null;
  winner: boolean;
  roasSeries: number[];
}

export interface AnalyticsData {
  configured: boolean;
  clients: BridgedClient[];
  totals: AggregatedResults;
  prevTotals: AggregatedResults;
  /** séries diárias ordenadas */
  days: string[];
  adjRoasByDay: Array<number | null>;
  spendByDay: Array<number | null>;
  creatives: CreativePerf[];
}

/** Janela [since, hoje] + janela anterior de mesmo tamanho para deltas. */
export async function fetchAnalytics(days: number, clientFilter: string | null): Promise<AnalyticsData> {
  const supabase = await createClient();
  let query = supabase.from("clients").select("id, name, perseo_client_id").not("perseo_client_id", "is", null);
  if (clientFilter) query = query.eq("id", clientFilter);
  const { data: clientRows } = await query;

  const clients: BridgedClient[] = (clientRows ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    perseoId: c.perseo_client_id as number,
  }));
  const perseoIds = clients.map((c) => c.perseoId);

  const sinceDate = new Date(Date.now() - days * 864e5);
  const prevSince = new Date(Date.now() - days * 2 * 864e5);
  const sinceStr = sinceDate.toISOString().slice(0, 10);
  const prevSinceStr = prevSince.toISOString().slice(0, 10);

  const [{ configured, rows: allRows }, creativesRes] = await Promise.all([
    fetchCampaignResults(perseoIds, { sinceDate: prevSinceStr }),
    fetchCreativesForPerseoClients(perseoIds),
  ]);

  const inWindow = allRows.filter((r) => (r.date ?? "") >= sinceStr);
  const inPrev = allRows.filter((r) => (r.date ?? "") < sinceStr);

  // séries diárias
  const byDay = new Map<string, CampaignResultRow[]>();
  for (const r of inWindow) {
    if (!r.date) continue;
    const k = r.date.slice(0, 10);
    byDay.set(k, [...(byDay.get(k) ?? []), r]);
  }
  const daysList = [...byDay.keys()].sort();
  const adjRoasByDay = daysList.map((d) => aggregateResults(byDay.get(d) ?? []).adjustedRoas);
  const spendByDay = daysList.map((d) => aggregateResults(byDay.get(d) ?? []).spend);

  // performance por criativo (video_id)
  const titleByVideo = new Map<number, string>();
  for (const c of creativesRes.rows) {
    if (c.video_id != null && !titleByVideo.has(c.video_id)) titleByVideo.set(c.video_id, c.title ?? `Vídeo #${c.video_id}`);
  }
  const nameByPerseo = new Map(clients.map((c) => [c.perseoId, c.name]));

  const byVideo = new Map<number, CampaignResultRow[]>();
  for (const r of inWindow) {
    if (r.video_id == null) continue;
    byVideo.set(r.video_id, [...(byVideo.get(r.video_id) ?? []), r]);
  }

  const perf: CreativePerf[] = [...byVideo.entries()].map(([videoId, rows]) => {
    const agg = aggregateResults(rows);
    const series = rows
      .filter((r) => r.date)
      .sort((a, b) => (a.date as string).localeCompare(b.date as string))
      .map((r) => adjustedRoas(r.roas, r.fraud_rate))
      .filter((v): v is number => v != null);
    return {
      videoId,
      title: titleByVideo.get(videoId) ?? `Vídeo #${videoId}`,
      clientName: nameByPerseo.get(rows[0]?.client_id ?? -1) ?? "—",
      spend: agg.spend,
      impressions: agg.impressions,
      hookRate: agg.hookRate,
      cpa: agg.cpa,
      roas: agg.roas,
      adjRoas: agg.adjustedRoas,
      fraudRate: agg.fraudRate,
      winner: false,
      roasSeries: series,
    };
  });

  // vencedor: melhor ROAS ajustado entre criativos com investimento relevante
  const spends = perf.map((p) => p.spend).sort((a, b) => a - b);
  const medianSpend = spends.length > 0 ? spends[Math.floor(spends.length / 2)] : 0;
  const eligible = perf.filter((p) => p.adjRoas != null && p.spend >= medianSpend);
  const best = eligible.reduce<CreativePerf | null>((acc, p) => (acc == null || (p.adjRoas ?? 0) > (acc.adjRoas ?? 0) ? p : acc), null);
  if (best) best.winner = true;

  perf.sort((a, b) => (b.adjRoas ?? -1) - (a.adjRoas ?? -1));

  return {
    configured,
    clients,
    totals: aggregateResults(inWindow),
    prevTotals: aggregateResults(inPrev),
    days: daysList,
    adjRoasByDay,
    spendByDay,
    creatives: perf,
  };
}
