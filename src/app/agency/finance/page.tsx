import type { Metadata } from "next";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/auth";
import { computeMrr } from "@/lib/metrics";
import { fmtCurrency, fmtDate, fmtNumber, fmtPercent } from "@/lib/format";
import { CLIENT_STATUS } from "@/lib/labels";
import { PageHeader } from "@/components/kit/page-header";
import { MetricCard } from "@/components/kit/metric-card";
import { EmptyState } from "@/components/kit/empty-state";
import { StatusBadge } from "@/components/kit/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HBarList } from "@/components/charts/hbar-list";

export const metadata: Metadata = { title: "Finance" };

const PLAN_LABEL: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  full_funnel: "Full-Funnel",
  a_la_carte: "À la carte",
  white_label: "White-label",
};

export default async function FinancePage() {
  await requireAgency();
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("*").order("monthly_value", { ascending: false, nullsFirst: false });
  const clients = data ?? [];

  const mrr = computeMrr(clients);
  const active = clients.filter((c) => c.status === "active");
  const paused = clients.filter((c) => c.status === "paused");
  const onboarding = clients.filter((c) => c.status === "onboarding");
  const churned = clients.filter((c) => c.status === "churned");

  const pausedValue = paused.reduce((acc, c) => acc + (c.monthly_value ?? 0), 0);

  // receita por plano
  const byPlan = new Map<string, number>();
  for (const c of active) {
    const plan = c.plan ?? "starter";
    byPlan.set(plan, (byPlan.get(plan) ?? 0) + (c.monthly_value ?? 0));
  }

  const bandOf = (c: (typeof clients)[number]) =>
    typeof c.intake?.revenue_band === "string" ? (c.intake.revenue_band as string) : null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Finance" subtitle="MRR, churn e pipeline comercial — direto do CRM." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard label="MRR" value={fmtCurrency(mrr.mrr)} accent hint={`${mrr.activeClients} contratos ativos`} />
        <MetricCard label="Ticket médio" value={fmtCurrency(mrr.avgTicket)} />
        <MetricCard label="Churn" value={fmtPercent(mrr.churnRatePct)} hint={`${churned.length} contas · ${fmtCurrency(mrr.churnedValue)}/mês perdidos`} />
        <MetricCard label="Em risco (pausados)" value={fmtCurrency(pausedValue)} hint={`${paused.length} conta${paused.length === 1 ? "" : "s"}`} />
        <MetricCard label="Pipeline" value={fmtNumber(onboarding.length)} hint="leads/onboardings abertos" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Receita por plano</CardTitle>
            </CardHeader>
            <CardContent>
              {byPlan.size === 0 ? (
                <p className="py-6 text-center text-xs text-ink-faint">Sem contratos ativos ainda.</p>
              ) : (
                <HBarList
                  items={[...byPlan.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .map(([plan, value]) => ({
                      label: PLAN_LABEL[plan] ?? plan,
                      value,
                      display: fmtCurrency(value),
                      color: plan === "full_funnel" ? "#00FF41" : plan === "growth" ? "#5BA3FF" : "#8C93A3",
                    }))}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pipeline de vendas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 p-3">
              {onboarding.length === 0 ? (
                <p className="py-4 text-center text-xs text-ink-faint">
                  Sem onboardings abertos — leads da landing entram aqui.
                </p>
              ) : (
                onboarding.map((c) => (
                  <Link
                    key={c.id}
                    href={`/agency/clients/${c.id}`}
                    className="flex items-center justify-between gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-surface-3/60"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-ink">{c.name}</span>
                      <span className="block text-[11px] text-ink-faint">{c.contact_email ?? "—"}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {bandOf(c) ? <span className="num text-[11px] text-info">{bandOf(c)}/mês</span> : null}
                      <span className="num text-[11px] text-ink-faint">step {c.onboarding_step}/7</span>
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contratos</CardTitle>
          </CardHeader>
          {clients.length === 0 ? (
            <CardContent>
              <EmptyState icon={Wallet} title="Nenhum cliente" description="Os números de MRR nascem do cadastro de clientes." />
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Mensalidade</TableHead>
                  <TableHead className="text-right">Desde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/agency/clients/${c.id}`} className="font-medium text-ink hover:text-neon">
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-ink-mute">{PLAN_LABEL[c.plan ?? ""] ?? c.plan ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge def={CLIENT_STATUS[c.status]} />
                    </TableCell>
                    <TableCell className="num text-right">{fmtCurrency(c.monthly_value)}</TableCell>
                    <TableCell className="num text-right text-ink-mute">{fmtDate(c.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
