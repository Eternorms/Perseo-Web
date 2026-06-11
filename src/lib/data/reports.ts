import "server-only";

import { createClient } from "@/lib/supabase/server";
import { fetchCampaignResults, fetchCreativesForPerseoClients } from "@/lib/data/creatives";
import { adjustedRoas, aggregateResults, buildFunnel, type AggregatedResults, type FunnelStep } from "@/lib/metrics";
import type { ClientRow, LeadStatus } from "@/types/database";

export interface MonthlyMediaTotals {
  impressions: number;
  reach: number;
  clicks: number;
  leads: number;
  spend: number;
  cpl: number | null;
  days: string[];
  leadsByDay: number[];
  spendByDay: number[];
}

export interface TopCreative {
  title: string;
  spend: number;
  adjRoas: number | null;
  hookRate: number | null;
}

export interface MonthlyReport {
  month: string; // YYYY-MM
  media: MonthlyMediaTotals | null;
  funnel: FunnelStep[];
  leadsTotal: number;
  leadsConverted: number;
  perseo: (AggregatedResults & { topCreatives: TopCreative[]; configured: boolean }) | null;
}

/** Agrega o mês fechado de um cliente: mídia (public) + resultados (perseo). */
export async function fetchMonthlyReport(client: ClientRow, month: string): Promise<MonthlyReport> {
  const supabase = await createClient();
  const start = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const end = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10); // 1º dia do mês seguinte

  const [metricsQ, leadsQ] = await Promise.all([
    supabase
      .from("campaign_metrics")
      .select("*")
      .eq("client_id", client.id)
      .gte("date", start)
      .lt("date", end)
      .order("date", { ascending: true }),
    supabase
      .from("leads")
      .select("status")
      .eq("client_id", client.id)
      .gte("created_at", `${start}T00:00:00Z`)
      .lt("created_at", `${end}T00:00:00Z`),
  ]);

  const metrics = metricsQ.data ?? [];
  const leads = leadsQ.data ?? [];

  let media: MonthlyMediaTotals | null = null;
  if (metrics.length > 0) {
    const byDay = new Map<string, { leads: number; spend: number }>();
    let impressions = 0;
    let reach = 0;
    let clicks = 0;
    let leadCount = 0;
    let spend = 0;
    for (const row of metrics) {
      impressions += row.impressions;
      reach += row.reach;
      clicks += row.clicks;
      leadCount += row.leads;
      spend += Number(row.spend);
      const cur = byDay.get(row.date) ?? { leads: 0, spend: 0 };
      byDay.set(row.date, { leads: cur.leads + row.leads, spend: cur.spend + Number(row.spend) });
    }
    const days = [...byDay.keys()].sort();
    media = {
      impressions,
      reach,
      clicks,
      leads: leadCount,
      spend,
      cpl: leadCount > 0 ? spend / leadCount : null,
      days,
      leadsByDay: days.map((d) => byDay.get(d)?.leads ?? 0),
      spendByDay: days.map((d) => byDay.get(d)?.spend ?? 0),
    };
  }

  const counts: Partial<Record<LeadStatus, number>> = {};
  for (const l of leads) counts[l.status as LeadStatus] = (counts[l.status as LeadStatus] ?? 0) + 1;

  let perseo: MonthlyReport["perseo"] = null;
  if (client.perseo_client_id) {
    const [resultsRes, creativesRes] = await Promise.all([
      fetchCampaignResults([client.perseo_client_id], { sinceDate: start }),
      fetchCreativesForPerseoClients([client.perseo_client_id]),
    ]);
    const monthRows = resultsRes.rows.filter((r) => (r.date ?? "") >= start && (r.date ?? "") < end);
    const agg = aggregateResults(monthRows);

    const titleByVideo = new Map<number, string>();
    for (const c of creativesRes.rows) {
      if (c.video_id != null && !titleByVideo.has(c.video_id)) titleByVideo.set(c.video_id, c.title ?? `Vídeo #${c.video_id}`);
    }
    const byVideo = new Map<number, typeof monthRows>();
    for (const r of monthRows) {
      if (r.video_id == null) continue;
      byVideo.set(r.video_id, [...(byVideo.get(r.video_id) ?? []), r]);
    }
    const topCreatives: TopCreative[] = [...byVideo.entries()]
      .map(([videoId, rows]) => {
        const a = aggregateResults(rows);
        return {
          title: titleByVideo.get(videoId) ?? `Vídeo #${videoId}`,
          spend: a.spend,
          adjRoas: adjustedRoas(a.roas, a.fraudRate),
          hookRate: a.hookRate,
        };
      })
      .sort((a, b) => (b.adjRoas ?? -1) - (a.adjRoas ?? -1))
      .slice(0, 3);

    perseo = { ...agg, topCreatives, configured: resultsRes.configured };
  }

  return {
    month,
    media,
    funnel: buildFunnel(counts),
    leadsTotal: leads.length,
    leadsConverted: counts.converted ?? 0,
    perseo,
  };
}
