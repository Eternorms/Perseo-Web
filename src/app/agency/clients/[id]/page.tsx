import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Clapperboard, Link2, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/auth";
import { fetchCreativesForPerseoClient } from "@/lib/data/creatives";
import { fmtCurrency, fmtDateTime, fmtRelative } from "@/lib/format";
import { CLIENT_STATUS, SERVICE_LABEL } from "@/lib/labels";
import { PageHeader } from "@/components/kit/page-header";
import { LinkTabs } from "@/components/kit/link-tabs";
import { EmptyState } from "@/components/kit/empty-state";
import { StatusBadge } from "@/components/kit/status-badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClientEditForm } from "@/components/agency/client-edit-form";
import { NewLeadDialog } from "@/components/agency/new-lead-dialog";
import { LeadStatusSelect } from "@/components/agency/lead-status-select";
import { NewAppointmentDialog } from "@/components/agency/new-appointment-dialog";
import { AppointmentStatusSelect } from "@/components/agency/appointment-status-select";
import { CreativeCard } from "@/components/creatives/creative-card";

export const metadata: Metadata = { title: "Cliente" };

const TABS = ["info", "leads", "appointments", "criativos"] as const;
type Tab = (typeof TABS)[number];

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { appUser } = await requireAgency();
  const { id } = await params;
  const sp = await searchParams;
  const tab: Tab = TABS.includes(sp.tab as Tab) ? (sp.tab as Tab) : "info";

  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (!client) notFound();

  const [leadsQ, apptsQ] = await Promise.all([
    supabase.from("leads").select("*").eq("client_id", id).order("created_at", { ascending: false }).limit(200),
    supabase.from("appointments").select("*").eq("client_id", id).order("scheduled_at", { ascending: false }).limit(100),
  ]);
  const leads = leadsQ.data ?? [];
  const appointments = apptsQ.data ?? [];

  const base = `/agency/clients/${id}`;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={client.name}
        subtitle={`${client.business_name}${client.niche ? ` · ${client.niche}` : ""}`}
        actions={
          <div className="flex items-center gap-3">
            <span className="num text-sm text-ink-mute">{fmtCurrency(client.monthly_value)}/mês</span>
            <StatusBadge def={CLIENT_STATUS[client.status]} />
          </div>
        }
      />

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-mute">
        <span>{client.contact_name ?? "Sem contato"} · {client.contact_email ?? "—"}</span>
        <span>Serviços: {(client.services ?? []).map((s) => SERVICE_LABEL[s] ?? s).join(" + ") || "—"}</span>
        <span className="num flex items-center gap-1">
          <Link2 className="size-3" aria-hidden />
          engine: {client.perseo_client_id ? `#${client.perseo_client_id}` : "não ligado"}
        </span>
      </div>

      <LinkTabs
        active={tab}
        tabs={[
          { value: "info", label: "Informações", href: `${base}?tab=info` },
          { value: "leads", label: "Leads", href: `${base}?tab=leads`, count: leads.length },
          { value: "appointments", label: "Agendamentos", href: `${base}?tab=appointments`, count: appointments.length },
          { value: "criativos", label: "Criativos", href: `${base}?tab=criativos` },
        ]}
      />

      {tab === "info" ? <ClientEditForm client={client} canDelete={appUser.user_type === "agency_owner"} /> : null}

      {tab === "leads" ? (
        <section className="flex flex-col gap-4">
          <div className="flex justify-end">
            <NewLeadDialog clientId={id} />
          </div>
          {leads.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="Nenhum lead deste cliente"
              description="Leads do formulário Meta entram automaticamente quando a integração está ativa; você também pode adicionar manualmente."
            />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Chegou</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <span className="font-medium">{lead.name ?? "Sem nome"}</span>
                        <span className="num block text-[11px] text-ink-faint">
                          {lead.phone ?? "—"}
                          {lead.email ? ` · ${lead.email}` : ""}
                        </span>
                      </TableCell>
                      <TableCell className="text-ink-mute">{lead.source ?? "—"}</TableCell>
                      <TableCell>
                        <LeadStatusSelect leadId={lead.id} clientId={id} status={lead.status} />
                      </TableCell>
                      <TableCell className="num text-right text-ink-mute">{fmtRelative(lead.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </section>
      ) : null}

      {tab === "appointments" ? (
        <section className="flex flex-col gap-4">
          <div className="flex justify-end">
            <NewAppointmentDialog clientId={id} leads={leads.map((l) => ({ id: l.id, name: l.name ?? l.phone ?? "Lead" }))} />
          </div>
          {appointments.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nenhum agendamento"
              description="Agendamentos criados aqui notificam o cliente no portal automaticamente."
            />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente / contato</TableHead>
                    <TableHead>Quando</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <span className="font-medium">{a.patient_name}</span>
                        <span className="num block text-[11px] text-ink-faint">{a.patient_phone ?? "—"}</span>
                      </TableCell>
                      <TableCell className="num">{fmtDateTime(a.scheduled_at)}</TableCell>
                      <TableCell>
                        <AppointmentStatusSelect appointmentId={a.id} clientId={id} status={a.status} />
                      </TableCell>
                      <TableCell className="max-w-56 truncate text-ink-mute">{a.notes ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </section>
      ) : null}

      {tab === "criativos" ? <CreativesTab perseoClientId={client.perseo_client_id} clientBase={base} /> : null}
    </div>
  );
}

async function CreativesTab({ perseoClientId, clientBase }: { perseoClientId: number | null; clientBase: string }) {
  if (!perseoClientId) {
    return (
      <EmptyState
        icon={Clapperboard}
        title="Engine de produção não ligado"
        description={`Preencha o campo "ID no engine (perseo)" na aba Informações para puxar os criativos do Perseo Produção.`}
        action={
          <a href={`${clientBase}?tab=info`} className="text-xs text-neon hover:underline">
            Ir para Informações →
          </a>
        }
      />
    );
  }

  const { configured, rows } = await fetchCreativesForPerseoClient(perseoClientId);
  if (!configured) {
    return (
      <EmptyState
        icon={Clapperboard}
        title="Conexão com o engine indisponível"
        description="Verifique SUPABASE_SERVICE_ROLE_KEY no ambiente — a leitura do schema perseo é server-side."
      />
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Clapperboard}
        title="Nenhum criativo no engine para este cliente"
        description="Assim que o pipeline de produção submeter vídeos para aprovação, eles aparecem aqui e no portal do cliente."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((c) => (
        <CreativeCard key={c.id} creative={c} mode="agency" />
      ))}
    </div>
  );
}
