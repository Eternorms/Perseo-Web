import type { Metadata } from "next";
import { Filter, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/auth";
import { buildFunnel, FUNNEL_ORDER } from "@/lib/metrics";
import { fmtDuration, fmtNumber, fmtPercent, fmtRelative } from "@/lib/format";
import { LEAD_STATUS } from "@/lib/labels";
import { PageHeader } from "@/components/kit/page-header";
import { EmptyState } from "@/components/kit/empty-state";
import { MetricCard } from "@/components/kit/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientParamSelect } from "@/components/agency/client-param-select";
import { FunnelStagesDialog } from "@/components/agency/funnel-stages-dialog";
import { NewLeadDialog } from "@/components/agency/new-lead-dialog";
import { LeadStatusSelect } from "@/components/agency/lead-status-select";
import type { LeadStatus } from "@/types/database";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Funis" };

const DEFAULT_COLORS: Record<string, string> = {
  new: "#5BA3FF",
  contacted: "#8C93A3",
  qualified: "#FFC857",
  scheduled: "#5BA3FF",
  converted: "#00FF41",
  lost: "#FF3D5A",
};

export default async function FunnelsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  await requireAgency();
  const params = await searchParams;
  const supabase = await createClient();

  const { data: clientsData } = await supabase
    .from("clients")
    .select("id, name, status")
    .neq("status", "churned")
    .order("name");
  const clients = clientsData ?? [];
  const selected = clients.find((c) => c.id === params.client) ?? clients[0] ?? null;

  if (!selected) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Funis" subtitle="Pipeline de leads por cliente." />
        <EmptyState
          icon={Filter}
          title="Nenhum cliente ativo"
          description="Crie um cliente para acompanhar o funil de tráfego dele aqui."
        />
      </div>
    );
  }

  const [leadsQ, stagesQ] = await Promise.all([
    supabase.from("leads").select("*").eq("client_id", selected.id).order("created_at", { ascending: false }),
    supabase.from("funnel_stages").select("*").eq("client_id", selected.id).order("position"),
  ]);
  const leads = leadsQ.data ?? [];
  const customStages = stagesQ.data ?? [];

  // etapas: custom quando definidas; fallback padrão
  const stageDefs: Array<{ value: LeadStatus; label: string; color: string }> = (
    customStages.length > 0
      ? customStages.filter((s) => (FUNNEL_ORDER as string[]).includes(s.value) || s.value === "lost")
      : [...FUNNEL_ORDER, "lost" as const].map((v) => ({ value: v, label: LEAD_STATUS[v].label, color: null }))
  ).map((s) => ({
    value: s.value as LeadStatus,
    label: s.label ?? LEAD_STATUS[s.value as LeadStatus].label,
    color: s.color ?? DEFAULT_COLORS[s.value] ?? "#8C93A3",
  }));

  const counts: Partial<Record<LeadStatus, number>> = {};
  for (const l of leads) counts[l.status] = (counts[l.status] ?? 0) + 1;
  const funnel = buildFunnel(counts);
  const top = funnel[0]?.count ?? 0;

  const converted = counts.converted ?? 0;
  const lost = counts.lost ?? 0;
  const conversionTotal = leads.length > 0 ? (converted / leads.length) * 100 : null;
  const responseTimes = leads.map((l) => l.response_time_seconds).filter((v): v is number => v != null);
  const avgResponse = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : null;

  const labelOf = (v: LeadStatus) => stageDefs.find((s) => s.value === v)?.label ?? LEAD_STATUS[v].label;
  const colorOf = (v: LeadStatus) => stageDefs.find((s) => s.value === v)?.color ?? "#8C93A3";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Funis"
        subtitle={`Pipeline de tráfego · ${selected.name}`}
        actions={
          <div className="flex items-center gap-2">
            <ClientParamSelect clients={clients} selected={selected.id} basePath="/agency/funis" />
            <FunnelStagesDialog
              clientId={selected.id}
              stages={stageDefs.map((s) => ({ value: s.value, label: s.label, color: s.color }))}
            />
            <NewLeadDialog clients={clients} />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Leads no funil" value={fmtNumber(leads.length)} />
        <MetricCard label="Conversão total" value={fmtPercent(conversionTotal)} accent />
        <MetricCard label="Resposta média" value={fmtDuration(avgResponse)} hint="1º contato após o lead chegar" />
        <MetricCard label="Perdidos" value={fmtNumber(lost)} />
      </div>

      {/* funil com taxas entre etapas */}
      <Card>
        <CardHeader>
          <CardTitle>Conversão entre etapas</CardTitle>
        </CardHeader>
        <CardContent>
          {top === 0 ? (
            <p className="py-6 text-center text-xs text-ink-faint">
              Sem leads ainda — o funil aparece assim que o primeiro lead entrar.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {funnel.map((step, i) => (
                <div key={step.status} className="grid grid-cols-[110px_1fr_120px] items-center gap-3 sm:grid-cols-[140px_1fr_150px]">
                  <span className="truncate text-xs text-ink-mute">{labelOf(step.status)}</span>
                  <div className="h-7 overflow-hidden rounded-sm bg-surface-3">
                    <div
                      className="flex h-full items-center rounded-sm px-2 transition-[width] duration-300"
                      style={{
                        width: `${Math.max((step.count / top) * 100, step.count > 0 ? 4 : 0)}%`,
                        background: `${colorOf(step.status)}26`,
                        borderLeft: `2px solid ${colorOf(step.status)}`,
                      }}
                    >
                      <span className="num text-xs text-ink">{step.count}</span>
                    </div>
                  </div>
                  <span className="num text-right text-[11px] text-ink-faint">
                    {i === 0 ? "topo" : step.conversionFromPrev != null ? `${fmtPercent(step.conversionFromPrev)} da etapa ant.` : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* pipeline em colunas */}
      {leads.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Pipeline vazio"
          description="Quando os leads do formulário Meta entrarem (ou você adicionar manualmente), eles aparecem por etapa aqui."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {stageDefs.map((stage) => {
            const stageLeads = leads.filter((l) => l.status === stage.value);
            return (
              <section key={stage.value} aria-label={`Etapa ${stage.label}`} className="flex flex-col rounded-lg border border-line bg-surface-1/60">
                <header className="flex items-center justify-between px-3 py-2.5">
                  <h2 className="flex items-center gap-1.5 text-xs font-medium text-ink">
                    <span aria-hidden className="size-2 rounded-full" style={{ background: stage.color }} />
                    {stage.label}
                  </h2>
                  <span className="num text-[10px] text-ink-faint">{stageLeads.length}</span>
                </header>
                <div className="flex flex-col gap-2 px-2 pb-2">
                  {stageLeads.map((lead) => (
                    <div key={lead.id} className="rounded-md border border-line bg-surface-2 p-2.5">
                      <p className="truncate text-[13px] font-medium text-ink">{lead.name ?? "Sem nome"}</p>
                      <p className="num truncate text-[11px] text-ink-faint">{lead.phone ?? lead.email ?? "—"}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="num text-[10px] text-ink-faint">{fmtRelative(lead.created_at)}</span>
                        <LeadStatusSelect leadId={lead.id} clientId={selected.id} status={lead.status} />
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 ? (
                    <p className={cn("rounded-md border border-dashed border-line px-2 py-4 text-center text-[10px] text-ink-faint")}>
                      vazio
                    </p>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
