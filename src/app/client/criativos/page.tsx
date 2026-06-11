import type { Metadata } from "next";
import { Clapperboard } from "lucide-react";
import { requireClient } from "@/lib/auth";
import { fetchCreativesForPerseoClient } from "@/lib/data/creatives";
import { CREATIVE_STATUS } from "@/lib/labels";
import { PageHeader } from "@/components/kit/page-header";
import { LinkTabs } from "@/components/kit/link-tabs";
import { EmptyState } from "@/components/kit/empty-state";
import { CreativeCard } from "@/components/creatives/creative-card";
import type { CreativeStatus } from "@/types/perseo";

export const metadata: Metadata = { title: "Criativos" };

const TABS: Array<{ value: string; label: string }> = [
  { value: "pending", label: "Para aprovar" },
  { value: "revision", label: "Em revisão" },
  { value: "approved", label: "Aprovados" },
  { value: "rejected", label: "Rejeitados" },
  { value: "all", label: "Todos" },
];

export default async function ClientCreativesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { client } = await requireClient();
  const params = await searchParams;
  const filter = TABS.some((t) => t.value === params.status) ? (params.status as string) : "pending";

  if (!client.perseo_client_id) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Criativos" subtitle="Aprove, peça ajustes ou rejeite os vídeos produzidos para sua marca." />
        <EmptyState
          icon={Clapperboard}
          title="Produção ainda não conectada"
          description="Sua conta está sendo ligada ao engine de produção da Perseo. Em breve seus vídeos aparecem aqui — fale com seu estrategista se demorar."
        />
      </div>
    );
  }

  const { configured, rows } = await fetchCreativesForPerseoClient(client.perseo_client_id);
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const visible = filter === "all" ? rows : rows.filter((r) => r.status === (filter as CreativeStatus));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Criativos"
        subtitle="Aprove, peça ajustes ou rejeite — seu feedback vira instrução direta de edição."
      />

      <LinkTabs
        active={filter}
        tabs={TABS.map((t) => ({
          value: t.value,
          label: t.label,
          href: t.value === "pending" ? "/client/criativos" : `/client/criativos?status=${t.value}`,
          count: t.value === "all" ? rows.length : (counts[t.value] ?? 0),
        }))}
      />

      {!configured ? (
        <EmptyState
          icon={Clapperboard}
          title="Conexão indisponível no momento"
          description="Tente novamente em instantes. Se persistir, avise seu estrategista."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Clapperboard}
          title={
            filter === "pending"
              ? "Nenhum vídeo aguardando sua aprovação"
              : `Nenhum criativo ${filter === "all" ? "" : CREATIVE_STATUS[filter as CreativeStatus].label.toLowerCase()}`
          }
          description="Novos vídeos do ciclo de produção chegam aqui e você é notificado."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => (
            <CreativeCard key={c.id} creative={c} mode="client" />
          ))}
        </div>
      )}
    </div>
  );
}
