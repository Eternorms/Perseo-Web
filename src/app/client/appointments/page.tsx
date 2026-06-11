import type { Metadata } from "next";
import { Bot, CalendarDays } from "lucide-react";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime, fmtRelative } from "@/lib/format";
import { AGENT_ACTION, AGENT_ACTION_STATUS, APPOINTMENT_STATUS } from "@/lib/labels";
import { PageHeader } from "@/components/kit/page-header";
import { EmptyState } from "@/components/kit/empty-state";
import { StatusBadge } from "@/components/kit/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentClientActions } from "@/components/client/appointment-actions";
import { RescheduleDialog } from "@/components/client/reschedule-dialog";

export const metadata: Metadata = { title: "Agendamentos" };

export default async function ClientAppointmentsPage() {
  const { client } = await requireClient();
  const supabase = await createClient();

  const now = new Date().toISOString();
  const [upcomingQ, pastQ, requestsQ] = await Promise.all([
    supabase
      .from("appointments")
      .select("*")
      .eq("client_id", client.id)
      .gte("scheduled_at", now)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("appointments")
      .select("*")
      .eq("client_id", client.id)
      .lt("scheduled_at", now)
      .order("scheduled_at", { ascending: false })
      .limit(30),
    supabase
      .from("agent_actions")
      .select("*")
      .eq("client_id", client.id)
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const upcoming = upcomingQ.data ?? [];
  const past = pastQ.data ?? [];
  const agentRequests = requestsQ.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Agendamentos"
        subtitle="Confirme ou cancele — a agência e o agente de IA são avisados na hora."
      />

      <Card>
        <CardHeader>
          <CardTitle>Próximos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 p-3">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nenhum agendamento futuro"
              description="Quando seus leads agendarem, os horários aparecem aqui para você confirmar."
              className="border-0 py-10"
            />
          ) : (
            upcoming.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{a.patient_name}</p>
                  <p className="num text-[11px] text-ink-faint">
                    {fmtDateTime(a.scheduled_at)}
                    {a.patient_phone ? ` · ${a.patient_phone}` : ""}
                  </p>
                  {a.notes ? <p className="mt-1 text-[11px] text-ink-mute">{a.notes}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <StatusBadge def={APPOINTMENT_STATUS[a.status]} />
                  {a.status === "scheduled" || a.status === "confirmed" ? (
                    <RescheduleDialog appointmentId={a.id} patientName={a.patient_name} scheduledAt={a.scheduled_at} />
                  ) : null}
                  <AppointmentClientActions appointmentId={a.id} clientId={client.id} status={a.status} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {agentRequests.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="size-4 text-neon" aria-hidden /> Solicitações ao agente
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5 p-3">
            {agentRequests.map((req) => {
              const payload = (req.payload ?? {}) as { patient_name?: string; preferred_at?: string };
              return (
                <div key={req.id} className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-ink">
                      {AGENT_ACTION[req.action_type]}
                      {payload.patient_name ? ` · ${payload.patient_name}` : ""}
                    </p>
                    <p className="num text-[11px] text-ink-faint">
                      {payload.preferred_at ? `preferência ${fmtDateTime(payload.preferred_at)} · ` : ""}
                      enviada {fmtRelative(req.created_at)}
                    </p>
                  </div>
                  <StatusBadge def={AGENT_ACTION_STATUS[req.status]} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {past.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 p-2">
            {past.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-md px-2.5 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-ink-mute">{a.patient_name}</p>
                  <p className="num text-[11px] text-ink-faint">{fmtDateTime(a.scheduled_at)}</p>
                </div>
                <StatusBadge def={APPOINTMENT_STATUS[a.status]} />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
