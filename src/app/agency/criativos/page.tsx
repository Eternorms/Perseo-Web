import type { Metadata } from "next";
import { Clapperboard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/auth";
import { fetchCreativesForPerseoClients } from "@/lib/data/creatives";
import { CREATIVE_STATUS } from "@/lib/labels";
import { PageHeader } from "@/components/kit/page-header";
import { LinkTabs } from "@/components/kit/link-tabs";
import { EmptyState } from "@/components/kit/empty-state";
import { CreativeCard } from "@/components/creatives/creative-card";
import type { CreativeStatus } from "@/types/perseo";

export const metadata: Metadata = { title: "Criativos" };

const STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Aguardando" },
  { value: "revision", label: "Em revisão" },
  { value: "approved", label: "Aprovados" },
  { value: "rejected", label: "Rejeitados" },
];

export default async function AgencyCreativesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAgency();
  const params = await searchParams;
  const filter = STATUS_TABS.some((t) => t.value === params.status) ? (params.status as string) : "all";

  const supabase = await createClient();
  const { data: clientsData } = await supabase
    .from("clients")
    .select("id, name, perseo_client_id")
    .not("perseo_client_id", "is", null);
  const bridgedClients = clientsData ?? [];
  const nameByPerseoId = new Map(bridgedClients.map((c) => [c.perseo_client_id as number, c.name]));

  const { configured, rows } = await fetchCreativesForPerseoClients(
    bridgedClients.map((c) => c.perseo_client_id as number),
  );

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === (filter as CreativeStatus));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Criativos"
        subtitle="Aprovações de todos os clientes — lidas do engine Perseo Produção."
      />

      <LinkTabs
        active={filter}
        tabs={STATUS_TABS.map((t) => ({
          value: t.value,
          label: t.label,
          href: t.value === "all" ? "/agency/criativos" : `/agency/criativos?status=${t.value}`,
          count: t.value === "all" ? rows.length : (counts[t.value] ?? 0),
        }))}
      />

      {bridgedClients.length === 0 ? (
        <EmptyState
          icon={Clapperboard}
          title="Nenhum cliente ligado ao engine"
          description="Preencha o perseo_client_id no detalhe de cada cliente para os criativos aparecerem aqui."
        />
      ) : !configured ? (
        <EmptyState
          icon={Clapperboard}
          title="Conexão com o engine indisponível"
          description="Verifique SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Clapperboard}
          title={filter === "all" ? "Nenhum criativo no engine" : `Nenhum criativo ${CREATIVE_STATUS[filter as CreativeStatus].label.toLowerCase()}`}
          description="O pipeline de produção (desktop) submete vídeos para cá automaticamente."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((c) => (
            <CreativeCard key={c.id} creative={c} mode="agency" clientName={nameByPerseoId.get(c.client_id)} />
          ))}
        </div>
      )}
    </div>
  );
}
