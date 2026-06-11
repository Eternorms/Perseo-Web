import type { Metadata } from "next";
import Link from "next/link";
import { Bot, CalendarDays, MessageSquare, UserPlus, Users } from "lucide-react";
import { AgentActionsList } from "@/components/agency/agent-actions-card";
import { DashboardRealtime } from "@/components/agency/dashboard-realtime";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/auth";
import { computeMrr, deltaPct } from "@/lib/metrics";
import { fmtCurrency, fmtDateTime, fmtNumber, fmtPercent, fmtRelative } from "@/lib/format";
import { MetricCard } from "@/components/kit/metric-card";
import { PageHeader } from "@/components/kit/page-header";
import { EmptyState } from "@/components/kit/empty-state";
import { StatusBadge } from "@/components/kit/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APPOINTMENT_STATUS, CLIENT_STATUS, LEAD_STATUS } from "@/lib/labels";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AgencyDashboardPage() {
  await requireAgency();
  const supabase = await createClient();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 864e5).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 864e5).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 864e5).toISOString();
  const in7days = new Date(now.getTime() + 7 * 864e5).toISOString();

  const [clientsQ, leadsWeekQ, leadsPrevWeekQ, leads30Q, apptsQ, unreadQ, recentLeadsQ, agentQ] = await Promise.all([
    supabase.from("clients").select("id, name, status, monthly_value, onboarding_step, created_at"),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", twoWeeksAgo).lt("created_at", weekAgo),
    supabase.from("leads").select("status").gte("created_at", monthAgo),
    supabase
      .from("appointments")
      .select("id, patient_name, scheduled_at, status, client_id, clients(name)")
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", in7days)
      .neq("status", "cancelled")
      .order("scheduled_at", { ascending: true })
      .limit(8),
    supabase
      .from("client_messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_type", "client")
      .is("read_at", null),
    supabase
      .from("leads")
      .select("id, name, phone, status, created_at, client_id, clients(name)")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("agent_actions")
      .select("*, clients(name)")
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const clients = clientsQ.data ?? [];
  const mrr = computeMrr(clients);
  const leadsWeek = leadsWeekQ.count ?? 0;
  const leadsPrevWeek = leadsPrevWeekQ.count ?? 0;
  const leads30 = leads30Q.data ?? [];
  const converted30 = leads30.filter((l) => l.status === "converted").length;
  const conversion = leads30.length > 0 ? (converted30 / leads30.length) * 100 : null;
  const appointments = apptsQ.data ?? [];
  const unread = unreadQ.count ?? 0;
  const recentLeads = recentLeadsQ.data ?? [];
  const agentActions = agentQ.data ?? [];
  const onboardings = clients.filter((c) => c.status === "onboarding");

  return (
    <div className="flex flex-col gap-6">
      <DashboardRealtime />
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral da operação — números ao vivo do CRM."
        actions={
          unread > 0 ? (
            <Link href="/agency/inbox">
              <Button variant="secondary" size="sm">
                <MessageSquare /> {unread} não lida{unread > 1 ? "s" : ""}
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard label="MRR" value={fmtCurrency(mrr.mrr)} accent hint={`${mrr.activeClients} contrato${mrr.activeClients === 1 ? "" : "s"} ativos`} />
        <MetricCard label="Clientes ativos" value={fmtNumber(mrr.activeClients)} hint={`${onboardings.length} em onboarding`} />
        <MetricCard label="Leads · 7d" value={fmtNumber(leadsWeek)} delta={deltaPct(leadsWeek, leadsPrevWeek)} />
        <MetricCard label="Conversão · 30d" value={fmtPercent(conversion)} hint={`${converted30}/${leads30.length} leads`} />
        <MetricCard label="Agendamentos · 7d" value={fmtNumber(appointments.length)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Leads recentes</CardTitle>
            <Link href="/agency/funis" className="text-xs text-ink-mute transition-colors hover:text-neon">
              Ver funis →
            </Link>
          </CardHeader>
          {recentLeads.length === 0 ? (
            <CardContent>
              <EmptyState
                icon={UserPlus}
                title="Nenhum lead ainda"
                description="Leads dos formulários Meta e da captura manual aparecem aqui em tempo real."
              />
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Chegou</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <span className="font-medium">{lead.name ?? "Sem nome"}</span>
                      <span className="num ml-2 text-[11px] text-ink-faint">{lead.phone}</span>
                    </TableCell>
                    <TableCell className="text-ink-mute">{lead.clients?.name ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge def={LEAD_STATUS[lead.status]} />
                    </TableCell>
                    <TableCell className="num text-right text-ink-mute">{fmtRelative(lead.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Próximos agendamentos</CardTitle>
              <Link href="/agency/schedule" className="text-xs text-ink-mute transition-colors hover:text-neon">
                Agenda →
              </Link>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 p-2">
              {appointments.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="Nada nos próximos 7 dias"
                  description="Agendamentos confirmados dos clientes aparecem aqui."
                  className="border-0 py-10"
                />
              ) : (
                appointments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-surface-3/60">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">{a.patient_name}</p>
                      <p className="text-[11px] text-ink-faint">{a.clients?.name ?? "—"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span className="num text-xs text-ink-mute">{fmtDateTime(a.scheduled_at)}</span>
                      <StatusBadge def={APPOINTMENT_STATUS[a.status]} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {agentActions.length > 0 ? (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="size-4 text-neon" aria-hidden /> Solicitações do agente
                </CardTitle>
                <span className="num text-[11px] text-warn">{agentActions.length} aberta{agentActions.length > 1 ? "s" : ""}</span>
              </CardHeader>
              <CardContent className="p-3">
                <AgentActionsList actions={agentActions} />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Onboardings em andamento</CardTitle>
              <Link href="/agency/clients" className="text-xs text-ink-mute transition-colors hover:text-neon">
                Clientes →
              </Link>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 p-2">
              {onboardings.length === 0 ? (
                <EmptyState icon={Users} title="Nenhum onboarding aberto" className="border-0 py-10" />
              ) : (
                onboardings.map((c) => (
                  <Link
                    key={c.id}
                    href={`/agency/clients/${c.id}`}
                    className="flex items-center justify-between gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-surface-3/60"
                  >
                    <span className="truncate text-[13px] text-ink">{c.name}</span>
                    <span className="flex items-center gap-2.5">
                      <span className="num text-[11px] text-ink-mute">step {c.onboarding_step}/7</span>
                      <StatusBadge def={CLIENT_STATUS[c.status]} />
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
