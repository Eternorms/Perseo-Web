import type { Metadata } from "next";
import { Terminal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/auth";
import { fetchCreativesForPerseoClients } from "@/lib/data/creatives";
import { fetchAnalytics } from "@/lib/data/analytics";
import { fmtCompact, fmtCurrency, fmtPercent, fmtRoas } from "@/lib/format";
import { EmptyState } from "@/components/kit/empty-state";
import { StudioTable } from "@/components/agency/studio-table";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Studio" };

/**
 * Command-center — “Bloomberg para criativos”: KPI ribbon ao vivo +
 * tabela densa de todos os criativos do engine, drawer de decisão.
 */
export default async function StudioPage() {
  await requireAgency();
  const supabase = await createClient();

  const { data: clientRows } = await supabase
    .from("clients")
    .select("id, name, perseo_client_id")
    .not("perseo_client_id", "is", null);
  const bridged = clientRows ?? [];
  const nameByPerseo = new Map(bridged.map((c) => [c.perseo_client_id as number, c.name]));

  const [{ configured, rows: creatives }, perf7] = await Promise.all([
    fetchCreativesForPerseoClients(bridged.map((c) => c.perseo_client_id as number)),
    fetchAnalytics(7, null),
  ]);

  const counts = creatives.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  const adjByVideo = new Map(perf7.creatives.map((p) => [p.videoId, p]));

  const ribbon: Array<{ label: string; value: string; tone?: "neon" | "loss" | "warn" }> = [
    { label: "AGUARDANDO", value: String(counts.pending ?? 0), tone: (counts.pending ?? 0) > 0 ? "warn" : undefined },
    { label: "EM REVISÃO", value: String(counts.revision ?? 0) },
    { label: "APROVADOS", value: String(counts.approved ?? 0), tone: "neon" },
    { label: "ROAS AJ · 7D", value: fmtRoas(perf7.totals.adjustedRoas), tone: "neon" },
    { label: "SPEND · 7D", value: fmtCurrency(perf7.totals.spend) },
    { label: "HOOK · 7D", value: fmtPercent(perf7.totals.hookRate) },
    {
      label: "FRAUDE · 7D",
      value: fmtPercent(perf7.totals.fraudRate),
      tone: (perf7.totals.fraudRate ?? 0) > 10 ? "loss" : undefined,
    },
  ];

  return (
    <div className="relative -m-4 flex min-h-[calc(100dvh-3rem)] flex-col lg:-m-8 lg:min-h-dvh">
      <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />

      {/* barra de status */}
      <header className="relative flex items-center justify-between border-b border-line bg-surface-1/80 px-4 py-2.5 lg:px-6">
        <h1 className="microlabel flex items-center gap-2 !text-ink-mute">
          <Terminal className="size-3.5 text-neon" aria-hidden />
          perseo · studio — command center
        </h1>
        <span className="flex items-center gap-1.5 text-[11px] text-neon">
          <span aria-hidden className="size-1.5 rounded-full bg-neon animate-live" />
          live
        </span>
      </header>

      {/* KPI ribbon */}
      <div className="relative grid grid-cols-2 divide-x divide-line border-b border-line bg-surface-0/90 sm:grid-cols-4 xl:grid-cols-7">
        {ribbon.map((k) => (
          <div key={k.label} className="px-4 py-3">
            <p className="microlabel">{k.label}</p>
            <p
              className={cn(
                "num mt-1 text-lg leading-none",
                k.tone === "neon" ? "text-neon" : k.tone === "loss" ? "text-loss" : k.tone === "warn" ? "text-warn" : "text-ink",
              )}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <div className="relative flex-1 p-4 lg:p-6">
        {bridged.length === 0 ? (
          <EmptyState
            icon={Terminal}
            title="Engine sem clientes ligados"
            description="O studio mostra todos os criativos do Perseo Produção. Ligue os clientes pela ponte perseo_client_id."
          />
        ) : !configured ? (
          <EmptyState icon={Terminal} title="Conexão com o engine indisponível" description="Verifique SUPABASE_SERVICE_ROLE_KEY." />
        ) : creatives.length === 0 ? (
          <EmptyState
            icon={Terminal}
            title="Nenhum criativo no engine"
            description="Assim que o pipeline submeter vídeos, eles entram aqui em tempo real de operação."
          />
        ) : (
          <StudioTable
            creatives={creatives.map((c) => ({
              creative: c,
              clientName: nameByPerseo.get(c.client_id) ?? `engine #${c.client_id}`,
              adjRoas: c.video_id != null ? (adjByVideo.get(c.video_id)?.adjRoas ?? null) : null,
              spend7: c.video_id != null ? (adjByVideo.get(c.video_id)?.spend ?? null) : null,
              series: c.video_id != null ? (adjByVideo.get(c.video_id)?.roasSeries ?? []) : [],
              winner: c.video_id != null ? (adjByVideo.get(c.video_id)?.winner ?? false) : false,
            }))}
          />
        )}
      </div>

      <footer className="relative border-t border-line bg-surface-1/80 px-4 py-2 lg:px-6">
        <p className="num text-[10px] text-ink-faint">
          {fmtCompact(creatives.length)} criativos · {bridged.length} contas ligadas · ROAS exibido = reportado × (1 − fraude)
        </p>
      </footer>
    </div>
  );
}
