import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clapperboard, UserPlus } from "lucide-react";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchCreativesForPerseoClient } from "@/lib/data/creatives";
import { deltaPct } from "@/lib/metrics";
import { fmtDateTime, fmtNumber, fmtPercent, fmtRelative } from "@/lib/format";
import { APPOINTMENT_STATUS, LEAD_STATUS } from "@/lib/labels";
import { PageHeader } from "@/components/kit/page-header";
import { MetricCard } from "@/components/kit/metric-card";
import { EmptyState } from "@/components/kit/empty-state";
import { StatusBadge } from "@/components/kit/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

export default async function ClientDashboardPage() {
  const { client } = await requireClient();
  const supabase = await createClient();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 864e5).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 864e5).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 864e5).toISOString();

  const [leadsWeekQ, leadsPrevQ, leads30Q, apptsQ, recentLeadsQ, pendingCreatives] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("client_id", client.id).gte("created_at", weekAgo),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("client_id", client.id)
      .gte("created_at", twoWeeksAgo)
      .lt("created_at", weekAgo),
    supabase.from("leads").select("status").eq("client_id", client.id).gte("created_at", monthAgo),
    supabase
      .from("appointments")
      .select("*")
      .eq("client_id", client.id)
      .gte("scheduled_at", now.toISOString())
      .neq("status", "cancelled")
      .order("scheduled_at", { ascending: true })
      .limit(6),
    supabase
      .from("leads")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(6),
    client.perseo_client_id
      ? fetchCreativesForPerseoClient(client.perseo_client_id).then((r) => r.rows.filter((c) => c.status === "pending").length)
      : Promise.resolve(0),
  ]);

  const leadsWeek = leadsWeekQ.count ?? 0;
  const leadsPrev = leadsPrevQ.count ?? 0;
  const leads30 = leads30Q.data ?? [];
  const converted = leads30.filter((l) => l.status === "converted").length;
  const conversion = leads30.length > 0 ? (converted / leads30.length) * 100 : null;
  const appointments = apptsQ.data ?? [];
  const recentLeads = recentLeadsQ.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Olá, ${client.contact_name?.split(" ")[0] ?? client.name}`}
        subtitle="Seus números desta semana — atualizados em tempo real."
        actions={
          pendingCreatives > 0 ? (
            <Link href="/client/criativos">
              <Button variant="primary" size="sm">
                <Clapperboard /> {pendingCreatives} criativo{pendingCreatives > 1 ? "s" : ""} aguardando você →
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Leads · 7 dias" value={fmtNumber(leadsWeek)} delta={deltaPct(leadsWeek, leadsPrev)} accent />
        <MetricCard
          label="Conversão · 30 dias"
          value={fmtPercent(conversion)}
          hint={leads30.length > 0 ? `${converted} de ${leads30.length} leads viraram clientes` : "sem leads no período"}
        />
        <MetricCard label="Próximos agendamentos" value={fmtNumber(appointments.length)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Leads recentes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 p-2">
            {recentLeads.length === 0 ? (
              <EmptyState
                icon={UserPlus}
                title="Nenhum lead ainda"
                description="Assim que suas campanhas captarem leads, eles aparecem aqui em tempo real."
                className="border-0 py-10"
              />
            ) : (
              recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-surface-3/60">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink">{lead.name ?? "Sem nome"}</p>
                    <p className="num text-[11px] text-ink-faint">{lead.phone ?? lead.email ?? "—"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <span className="num text-[11px] text-ink-faint">{fmtRelative(lead.created_at)}</span>
                    <StatusBadge def={LEAD_STATUS[lead.status]} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Próximos agendamentos</CardTitle>
            <Link href="/client/appointments" className="text-xs text-ink-mute transition-colors hover:text-neon">
              Ver todos →
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 p-2">
            {appointments.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Nada agendado"
                description="Os agendamentos confirmados dos seus leads aparecem aqui."
                className="border-0 py-10"
              />
            ) : (
              appointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-surface-3/60">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink">{a.patient_name}</p>
                    <p className="num text-[11px] text-ink-faint">{fmtDateTime(a.scheduled_at)}</p>
                  </div>
                  <StatusBadge def={APPOINTMENT_STATUS[a.status]} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
