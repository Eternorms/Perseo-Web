import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FileBarChart } from "lucide-react";
import { requireClient } from "@/lib/auth";
import { fetchMonthlyReport } from "@/lib/data/reports";
import { fmtCompact, fmtCurrency, fmtDateShort, fmtMonth, fmtNumber, fmtPercent, fmtRoas } from "@/lib/format";
import { LEAD_STATUS } from "@/lib/labels";
import { PageHeader } from "@/components/kit/page-header";
import { MetricCard } from "@/components/kit/metric-card";
import { EmptyState } from "@/components/kit/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "@/components/charts/line-chart";
import { HBarList } from "@/components/charts/hbar-list";

export const metadata: Metadata = { title: "Relatórios" };

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function ClientReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { client } = await requireClient();
  const params = await searchParams;

  const current = new Date().toISOString().slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(params.month ?? "") ? (params.month as string) : current;
  const report = await fetchMonthlyReport(client, month);

  const hasAnything = report.media != null || report.leadsTotal > 0 || (report.perseo?.spend ?? 0) > 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Relatório mensal"
        subtitle="O resumo que a Perseo usa para decidir o próximo ciclo — sem vaidade, só número."
        actions={
          <div className="flex items-center gap-1">
            <Link
              href={`/client/reports?month=${shiftMonth(month, -1)}`}
              aria-label="Mês anterior"
              className="rounded-md p-1.5 text-ink-mute transition-colors hover:bg-surface-3 hover:text-ink"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <span className="num min-w-36 text-center text-sm capitalize text-ink">{fmtMonth(`${month}-01`)}</span>
            {month < current ? (
              <Link
                href={`/client/reports?month=${shiftMonth(month, 1)}`}
                aria-label="Próximo mês"
                className="rounded-md p-1.5 text-ink-mute transition-colors hover:bg-surface-3 hover:text-ink"
              >
                <ChevronRight className="size-4" />
              </Link>
            ) : (
              <span className="p-1.5 opacity-30" aria-hidden>
                <ChevronRight className="size-4" />
              </span>
            )}
          </div>
        }
      />

      {!hasAnything ? (
        <EmptyState
          icon={FileBarChart}
          title={`Sem dados em ${fmtMonth(`${month}-01`)}`}
          description="Quando houver investimento, leads ou resultados de criativos no mês, o relatório é montado automaticamente aqui."
        />
      ) : (
        <>
          {/* performance de criativos (perseo) */}
          {report.perseo && report.perseo.configured && report.perseo.spend > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="microlabel">Performance de criativos</h2>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard
                  label="ROAS ajustado"
                  value={fmtRoas(report.perseo.adjustedRoas)}
                  accent
                  hint={
                    report.perseo.roas != null && report.perseo.fraudRate != null
                      ? `reportado ${fmtRoas(report.perseo.roas)} · fraude ${fmtPercent(report.perseo.fraudRate)}`
                      : undefined
                  }
                />
                <MetricCard label="Investimento" value={fmtCurrency(report.perseo.spend)} />
                <MetricCard label="CPA" value={fmtCurrency(report.perseo.cpa)} />
                <MetricCard label="Hook rate" value={fmtPercent(report.perseo.hookRate)} />
              </div>
              {report.perseo.topCreatives.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Criativos do mês</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HBarList
                      items={report.perseo.topCreatives.map((c, i) => ({
                        label: c.title,
                        value: c.adjRoas ?? 0,
                        display: fmtRoas(c.adjRoas),
                        sub: `${fmtCurrency(c.spend)} investidos`,
                        color: i === 0 ? "#00FF41" : "#5BA3FF",
                      }))}
                    />
                  </CardContent>
                </Card>
              ) : null}
            </section>
          ) : null}

          {/* mídia & captação (public.campaign_metrics) */}
          <section className="flex flex-col gap-3">
            <h2 className="microlabel">Mídia & captação</h2>
            {report.media ? (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                  <MetricCard label="Leads captados" value={fmtNumber(report.media.leads)} accent={report.perseo == null} />
                  <MetricCard label="Investimento" value={fmtCurrency(report.media.spend)} />
                  <MetricCard label="CPL médio" value={fmtCurrency(report.media.cpl)} />
                  <MetricCard label="Impressões" value={fmtCompact(report.media.impressions)} />
                  <MetricCard label="Cliques" value={fmtCompact(report.media.clicks)} />
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Leads por dia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LineChart
                      series={[{ label: "Leads", color: "#00FF41", points: report.media.leadsByDay }]}
                      xLabels={report.media.days.map(fmtDateShort)}
                      formatY={(v) => String(Math.round(v))}
                      height={150}
                    />
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent>
                  <p className="py-4 text-center text-xs text-ink-faint">Sem métricas de mídia registradas neste mês.</p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* funil do mês */}
          <section className="flex flex-col gap-3">
            <h2 className="microlabel">Funil do mês</h2>
            <Card>
              <CardContent>
                {report.leadsTotal === 0 ? (
                  <p className="py-4 text-center text-xs text-ink-faint">Nenhum lead entrou no funil neste mês.</p>
                ) : (
                  <HBarList
                    items={report.funnel.map((step) => ({
                      label: LEAD_STATUS[step.status].label,
                      value: step.count,
                      sub: step.conversionFromPrev != null ? `${fmtPercent(step.conversionFromPrev)} da etapa anterior` : undefined,
                      color: step.status === "converted" ? "#00FF41" : "#5BA3FF",
                    }))}
                  />
                )}
              </CardContent>
            </Card>
            {report.leadsTotal > 0 ? (
              <p className="text-xs text-ink-mute">
                <span className="num text-ink">{report.leadsConverted}</span> de{" "}
                <span className="num text-ink">{report.leadsTotal}</span> leads converteram em{" "}
                {fmtMonth(`${month}-01`)}.
              </p>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
