import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { requireAgency } from "@/lib/auth";
import { fetchAnalytics } from "@/lib/data/analytics";
import { deltaPct } from "@/lib/metrics";
import { fmtCurrency, fmtCompact, fmtDateShort, fmtPercent, fmtRoas } from "@/lib/format";
import { PageHeader } from "@/components/kit/page-header";
import { MetricCard } from "@/components/kit/metric-card";
import { EmptyState } from "@/components/kit/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart } from "@/components/charts/line-chart";
import { Sparkline } from "@/components/charts/sparkline";
import { ClientParamSelect } from "@/components/agency/client-param-select";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

const PERIODS = [7, 30, 90];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; days?: string }>;
}) {
  await requireAgency();
  const params = await searchParams;
  const days = PERIODS.includes(Number(params.days)) ? Number(params.days) : 30;
  const clientFilter = params.client || null;

  const data = await fetchAnalytics(days, clientFilter);
  const { totals, prevTotals } = data;

  const periodHref = (d: number) =>
    `/agency/analytics?days=${d}${clientFilter ? `&client=${clientFilter}` : ""}`;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Analytics"
        subtitle="Performance por criativo — ROAS sempre ajustado por fraude."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-line p-0.5" role="group" aria-label="Período">
              {PERIODS.map((d) => (
                <Link
                  key={d}
                  href={periodHref(d)}
                  className={cn(
                    "num rounded-[5px] px-2.5 py-1 text-xs transition-colors",
                    d === days ? "bg-surface-3 text-ink" : "text-ink-faint hover:text-ink",
                  )}
                >
                  {d}d
                </Link>
              ))}
            </div>
            {data.clients.length > 0 ? (
              <ClientParamSelect clients={data.clients} selected={clientFilter ?? ""} basePath="/agency/analytics" allowAll />
            ) : null}
          </div>
        }
      />

      {data.clients.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Nenhum cliente ligado ao engine"
          description="Analytics lê perseo.campaign_results. Preencha o perseo_client_id dos clientes para ativar."
        />
      ) : !data.configured ? (
        <EmptyState icon={BarChart3} title="Conexão com o engine indisponível" description="Verifique SUPABASE_SERVICE_ROLE_KEY." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <MetricCard
              label={`ROAS aj. · ${days}d`}
              value={fmtRoas(totals.adjustedRoas)}
              delta={deltaPct(totals.adjustedRoas, prevTotals.adjustedRoas)}
              accent
              hint={totals.roas != null && totals.fraudRate != null ? `reportado ${fmtRoas(totals.roas)} − fraude` : undefined}
            />
            <MetricCard
              label="Investimento"
              value={fmtCurrency(totals.spend)}
              delta={deltaPct(totals.spend, prevTotals.spend)}
            />
            <MetricCard
              label="CPA"
              value={fmtCurrency(totals.cpa)}
              delta={deltaPct(totals.cpa, prevTotals.cpa)}
              deltaGoodWhen="down"
            />
            <MetricCard
              label="Hook rate"
              value={fmtPercent(totals.hookRate)}
              delta={deltaPct(totals.hookRate, prevTotals.hookRate)}
            />
            <MetricCard
              label="Fraude"
              value={fmtPercent(totals.fraudRate)}
              delta={deltaPct(totals.fraudRate, prevTotals.fraudRate)}
              deltaGoodWhen="down"
              hint={`${fmtCompact(totals.fraudClicks)} cliques inválidos`}
            />
          </div>

          {data.days.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Sem resultados no período"
              description="Quando o pipeline gravar campaign_results, as séries aparecem aqui."
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>ROAS ajustado (diário)</CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart
                    series={[{ label: "ROAS aj.", color: "#00FF41", points: data.adjRoasByDay }]}
                    xLabels={data.days.map(fmtDateShort)}
                    formatY={(v) => `${v.toFixed(1)}×`}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Investimento (diário)</CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart
                    series={[{ label: "Spend", color: "#5BA3FF", points: data.spendByDay }]}
                    xLabels={data.days.map(fmtDateShort)}
                    formatY={(v) => fmtCompact(v)}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Criativos no período</CardTitle>
            </CardHeader>
            {data.creatives.length === 0 ? (
              <CardContent>
                <p className="py-6 text-center text-xs text-ink-faint">Nenhum criativo com resultado no período.</p>
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Criativo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                    <TableHead className="text-right">Hook</TableHead>
                    <TableHead className="text-right">CPA</TableHead>
                    <TableHead className="text-right">ROAS aj.</TableHead>
                    <TableHead className="text-right">Fraude</TableHead>
                    <TableHead>Tendência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.creatives.map((c) => (
                    <TableRow key={c.videoId}>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span className="max-w-64 truncate font-medium">{c.title}</span>
                          {c.winner ? <Badge tone="neon">VENCEDOR</Badge> : null}
                        </span>
                      </TableCell>
                      <TableCell className="text-ink-mute">{c.clientName}</TableCell>
                      <TableCell className="num text-right">{fmtCurrency(c.spend)}</TableCell>
                      <TableCell className="num text-right">{fmtPercent(c.hookRate)}</TableCell>
                      <TableCell className="num text-right">{fmtCurrency(c.cpa)}</TableCell>
                      <TableCell className={cn("num text-right", c.winner ? "text-neon" : "")}>{fmtRoas(c.adjRoas)}</TableCell>
                      <TableCell className={cn("num text-right", (c.fraudRate ?? 0) > 10 ? "text-loss" : "text-ink-mute")}>
                        {fmtPercent(c.fraudRate)}
                      </TableCell>
                      <TableCell>
                        <Sparkline points={c.roasSeries} color={c.winner ? "#00FF41" : "#5BA3FF"} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
