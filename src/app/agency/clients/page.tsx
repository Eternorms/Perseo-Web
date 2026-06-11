import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/auth";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { CLIENT_STATUS, SERVICE_LABEL } from "@/lib/labels";
import { PageHeader } from "@/components/kit/page-header";
import { EmptyState } from "@/components/kit/empty-state";
import { StatusBadge } from "@/components/kit/status-badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { NewClientDialog } from "@/components/agency/new-client-dialog";
import { ClientsFilter } from "@/components/agency/clients-filter";
import type { ClientStatus } from "@/types/database";

export const metadata: Metadata = { title: "Clientes" };

const STATUS_VALUES: ClientStatus[] = ["onboarding", "active", "paused", "churned"];

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAgency();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = STATUS_VALUES.includes(params.status as ClientStatus) ? (params.status as ClientStatus) : null;

  const supabase = await createClient();
  let query = supabase.from("clients").select("*").order("created_at", { ascending: false });
  if (q) query = query.or(`name.ilike.%${q}%,business_name.ilike.%${q}%,contact_email.ilike.%${q}%`);
  if (status) query = query.eq("status", status);
  const { data: clients } = await query;

  const rows = clients ?? [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Clientes"
        subtitle={`${rows.length} conta${rows.length === 1 ? "" : "s"}${status ? ` · ${CLIENT_STATUS[status].label}` : ""}`}
        actions={<NewClientDialog />}
      />

      <ClientsFilter q={q} status={status ?? ""} />

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q || status ? "Nenhum cliente nesse filtro" : "Nenhum cliente ainda"}
          description={
            q || status
              ? "Ajuste a busca ou limpe os filtros."
              : "Crie o primeiro cliente ou aguarde a captura de leads da landing — eles entram aqui em onboarding."
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Serviços</TableHead>
                <TableHead className="text-right">Mensalidade</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-right">Desde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/agency/clients/${c.id}`} className="flex items-center gap-2.5 font-medium text-ink hover:text-neon">
                      <Avatar name={c.name} tone={c.status === "active" ? "neon" : "default"} />
                      <span>
                        {c.name}
                        <span className="block text-[11px] font-normal text-ink-faint">{c.niche ?? "—"}</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge def={CLIENT_STATUS[c.status]} />
                    {c.status === "onboarding" ? (
                      <span className="num ml-2 text-[10px] text-ink-faint">step {c.onboarding_step}/7</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-ink-mute">
                    {(c.services ?? []).map((s) => SERVICE_LABEL[s] ?? s).join(" + ") || "—"}
                  </TableCell>
                  <TableCell className="num text-right">{fmtCurrency(c.monthly_value)}</TableCell>
                  <TableCell>
                    <span className="block text-ink-mute">{c.contact_name ?? "—"}</span>
                    <span className="block text-[11px] text-ink-faint">{c.contact_email ?? ""}</span>
                  </TableCell>
                  <TableCell className="num text-right text-ink-mute">{fmtDate(c.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
