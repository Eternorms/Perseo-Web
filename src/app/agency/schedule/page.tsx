import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ListTodo } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/auth";
import { fmtTime } from "@/lib/format";
import { APPOINTMENT_STATUS } from "@/lib/labels";
import { PageHeader } from "@/components/kit/page-header";
import { EmptyState } from "@/components/kit/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewAppointmentDialog } from "@/components/agency/new-appointment-dialog";
import { AppointmentStatusSelect } from "@/components/agency/appointment-status-select";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Agenda" };

const WEEKDAYS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

function ymKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function dayKey(d: Date) {
  return `${ymKey(d)}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  await requireAgency();
  const params = await searchParams;

  const today = new Date();
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(params.month ?? "");
  const year = monthMatch ? Number(monthMatch[1]) : today.getFullYear();
  const month = monthMatch ? Number(monthMatch[2]) - 1 : today.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  const selectedDay = /^\d{4}-\d{2}-\d{2}$/.test(params.day ?? "") ? (params.day as string) : null;

  const supabase = await createClient();
  const [apptsQ, clientsQ, followupsQ] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, clients(name)")
      .gte("scheduled_at", new Date(year, month, 1).toISOString())
      .lt("scheduled_at", new Date(year, month + 1, 1).toISOString())
      .order("scheduled_at", { ascending: true }),
    supabase.from("clients").select("id, name").order("name"),
    supabase
      .from("followup_queue")
      .select("*, leads(name, phone), clients(name)")
      .eq("status", "pending")
      .order("scheduled_at", { ascending: true })
      .limit(30),
  ]);

  const appointments = apptsQ.data ?? [];
  const clients = clientsQ.data ?? [];
  const followups = followupsQ.data ?? [];

  const byDay = new Map<string, typeof appointments>();
  for (const a of appointments) {
    const k = dayKey(new Date(a.scheduled_at));
    byDay.set(k, [...(byDay.get(k) ?? []), a]);
  }

  // grade: começa na segunda anterior ao dia 1
  const startOffset = (first.getDay() + 6) % 7;
  const cells: Array<Date | null> = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: last.getDate() }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = ymKey(new Date(year, month - 1, 1));
  const nextMonth = ymKey(new Date(year, month + 1, 1));
  const monthLabel = first.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const dayAppointments = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Agenda"
        subtitle="Agendamentos de todos os clientes + fila de follow-up."
        actions={<NewAppointmentDialog clients={clients} />}
      />

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="capitalize">{monthLabel}</CardTitle>
            <div className="flex items-center gap-1">
              <Link
                href={`/agency/schedule?month=${prevMonth}`}
                aria-label="Mês anterior"
                className="rounded-md p-1.5 text-ink-mute transition-colors hover:bg-surface-3 hover:text-ink"
              >
                <ChevronLeft className="size-4" />
              </Link>
              <Link href="/agency/schedule" className="rounded-md px-2 py-1 text-xs text-ink-mute transition-colors hover:bg-surface-3 hover:text-ink">
                hoje
              </Link>
              <Link
                href={`/agency/schedule?month=${nextMonth}`}
                aria-label="Próximo mês"
                className="rounded-md p-1.5 text-ink-mute transition-colors hover:bg-surface-3 hover:text-ink"
              >
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((d) => (
                <span key={d} className="microlabel px-1.5 py-1 text-center">
                  {d}
                </span>
              ))}
              {cells.map((date, i) => {
                if (!date) return <span key={`x-${i}`} aria-hidden />;
                const k = dayKey(date);
                const dayAppts = byDay.get(k) ?? [];
                const isToday = dayKey(today) === k;
                const isSelected = selectedDay === k;
                return (
                  <Link
                    key={k}
                    href={`/agency/schedule?month=${ymKey(first)}&day=${k}`}
                    aria-label={`Dia ${date.getDate()}, ${dayAppts.length} agendamento(s)`}
                    className={cn(
                      "flex min-h-20 flex-col gap-1 rounded-md border p-1.5 transition-colors",
                      isSelected ? "border-neon/50 bg-neon/5" : "border-line hover:border-line-strong",
                    )}
                  >
                    <span
                      className={cn(
                        "num self-end rounded-sm px-1 text-[11px]",
                        isToday ? "bg-neon text-onneon font-semibold" : "text-ink-faint",
                      )}
                    >
                      {date.getDate()}
                    </span>
                    {dayAppts.slice(0, 2).map((a) => (
                      <span key={a.id} className="num truncate rounded-sm bg-surface-3 px-1 py-0.5 text-[10px] text-ink-mute">
                        {fmtTime(a.scheduled_at)} {a.patient_name}
                      </span>
                    ))}
                    {dayAppts.length > 2 ? (
                      <span className="num text-[10px] text-neon">+{dayAppts.length - 2}</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDay
                  ? `Dia ${selectedDay.slice(8, 10)}/${selectedDay.slice(5, 7)}`
                  : "Selecione um dia no calendário"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-3">
              {selectedDay && dayAppointments.length === 0 ? (
                <p className="px-1 py-4 text-center text-xs text-ink-faint">Sem agendamentos neste dia.</p>
              ) : null}
              {!selectedDay ? (
                <p className="px-1 py-4 text-center text-xs text-ink-faint">Clique em um dia para ver os detalhes.</p>
              ) : null}
              {dayAppointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 rounded-md border border-line p-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink">{a.patient_name}</p>
                    <p className="text-[11px] text-ink-faint">
                      {a.clients?.name ?? "—"} · <span className="num">{fmtTime(a.scheduled_at)}</span>
                    </p>
                  </div>
                  <AppointmentStatusSelect appointmentId={a.id} clientId={a.client_id} status={a.status} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Follow-ups pendentes</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 p-3">
              {followups.length === 0 ? (
                <EmptyState
                  icon={ListTodo}
                  title="Fila vazia"
                  description="Follow-ups automáticos de leads sem resposta entram aqui."
                  className="border-0 py-8"
                />
              ) : (
                followups.map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-surface-3/60">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-ink">{f.leads?.name ?? f.leads?.phone ?? "Lead"}</p>
                      <p className="text-[11px] text-ink-faint">{f.clients?.name ?? "—"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone="info">D+{f.day}</Badge>
                      <span className="num text-[11px] text-ink-mute">
                        {new Date(f.scheduled_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
