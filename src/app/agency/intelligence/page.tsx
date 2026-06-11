import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Brain } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAgency } from "@/lib/auth";
import { fetchKnowledgeGraph } from "@/lib/data/intelligence";
import { PageHeader } from "@/components/kit/page-header";
import { EmptyState } from "@/components/kit/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientParamSelect } from "@/components/agency/client-param-select";
import { cn } from "@/lib/utils";
import type { KgEntityRow } from "@/types/perseo";

export const metadata: Metadata = { title: "Intelligence" };

/** Cadeia canônica do funil criativo — orienta a ordenação dos tipos. */
const TYPE_ORDER = ["dor", "pain", "audience", "angulo", "angle", "hook", "creative", "resultado", "result"];
const TYPE_COLOR: Record<string, string> = {
  dor: "#FF3D5A",
  pain: "#FF3D5A",
  angulo: "#FFC857",
  angle: "#FFC857",
  hook: "#5BA3FF",
  resultado: "#00FF41",
  result: "#00FF41",
};

function entityLabel(e: KgEntityRow): string {
  const attrs = e.attrs ?? {};
  const label = attrs.label ?? attrs.name ?? attrs.text;
  return typeof label === "string" && label.length > 0 ? label : e.key;
}

export default async function IntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; type?: string; focus?: string }>;
}) {
  await requireAgency();
  const params = await searchParams;
  const supabase = await createClient();

  const { data: clientRows } = await supabase
    .from("clients")
    .select("id, name, perseo_client_id")
    .not("perseo_client_id", "is", null)
    .order("name");
  const bridged = clientRows ?? [];
  const selectedClient = bridged.find((c) => c.id === params.client) ?? null;

  const kg = await fetchKnowledgeGraph(selectedClient ? (selectedClient.perseo_client_id as number) : null);

  const byId = new Map(kg.entities.map((e) => [e.id, e]));
  const types = [...new Set(kg.entities.map((e) => e.type))].sort(
    (a, b) => (TYPE_ORDER.indexOf(a) + 99) - (TYPE_ORDER.indexOf(b) + 99) || a.localeCompare(b),
  );
  const typeFilter = types.includes(params.type ?? "") ? (params.type as string) : null;

  const focusId = Number(params.focus);
  const focus = Number.isInteger(focusId) ? (byId.get(focusId) ?? null) : null;

  const visible = kg.entities
    .filter((e) => (typeFilter ? e.type === typeFilter : true))
    .slice(0, 200);

  const edgesOf = (id: number) => ({
    out: kg.edges.filter((e) => e.src_id === id && byId.has(e.dst_id)),
    inn: kg.edges.filter((e) => e.dst_id === id && byId.has(e.src_id)),
  });

  // padrões vencedores: conexões mais fortes do grafo visível
  const topEdges = kg.edges.filter((e) => byId.has(e.src_id) && byId.has(e.dst_id)).slice(0, 14);
  const maxWeight = Math.max(...topEdges.map((e) => e.weight ?? 0), 1);

  const hrefWith = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams();
    if (params.client) sp.set("client", params.client);
    if (typeFilter) sp.set("type", typeFilter);
    for (const [k, v] of Object.entries(next)) {
      if (v == null) sp.delete(k);
      else sp.set(k, v);
    }
    const s = sp.toString();
    return `/agency/intelligence${s ? `?${s}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Intelligence"
        subtitle="Knowledge Graph criativo — dor → ângulo → hook → resultado."
        actions={
          bridged.length > 0 ? (
            <ClientParamSelect clients={bridged} selected={selectedClient?.id ?? ""} basePath="/agency/intelligence" allowAll />
          ) : undefined
        }
      />

      {bridged.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="Nenhum cliente ligado ao engine"
          description="O grafo nasce no Perseo Produção. Ligue os clientes pela ponte perseo_client_id."
        />
      ) : !kg.configured ? (
        <EmptyState icon={Brain} title="Conexão com o engine indisponível" description="Verifique SUPABASE_SERVICE_ROLE_KEY." />
      ) : kg.entities.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="Grafo vazio"
          description="Cada ciclo de teste alimenta o grafo com dores, ângulos, hooks e resultados. Os padrões aparecem aqui."
        />
      ) : (
        <>
          {/* filtros por tipo */}
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por tipo">
            <Link
              href={hrefWith({ type: null, focus: null })}
              className={cn(
                "num rounded-md border px-2.5 py-1 text-[11px] uppercase tracking-wide transition-colors",
                !typeFilter ? "border-neon/40 bg-neon/10 text-neon" : "border-line text-ink-faint hover:text-ink",
              )}
            >
              todos · {kg.entities.length}
            </Link>
            {types.map((t) => {
              const count = kg.entities.filter((e) => e.type === t).length;
              return (
                <Link
                  key={t}
                  href={hrefWith({ type: t, focus: null })}
                  className={cn(
                    "num inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] uppercase tracking-wide transition-colors",
                    typeFilter === t ? "border-neon/40 bg-neon/10 text-neon" : "border-line text-ink-faint hover:text-ink",
                  )}
                >
                  <span aria-hidden className="size-1.5 rounded-full" style={{ background: TYPE_COLOR[t] ?? "#8C93A3" }} />
                  {t} · {count}
                </Link>
              );
            })}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
            {/* navegador de entidades */}
            <Card className="max-h-[540px] overflow-y-auto">
              <CardHeader className="sticky top-0 z-10 bg-surface-2">
                <CardTitle>Entidades {typeFilter ? `· ${typeFilter}` : ""}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 p-2">
                {visible.map((e) => (
                  <Link
                    key={e.id}
                    href={hrefWith({ focus: String(e.id) })}
                    aria-current={focus?.id === e.id ? "true" : undefined}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                      focus?.id === e.id ? "bg-surface-3 text-ink" : "text-ink-mute hover:bg-surface-3/60 hover:text-ink",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: TYPE_COLOR[e.type] ?? "#8C93A3" }} />
                      <span className="truncate">{entityLabel(e)}</span>
                    </span>
                    <span className="num shrink-0 text-[10px] text-ink-faint">{e.type}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* painel de foco / padrões */}
            <div className="flex flex-col gap-4">
              {focus ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span aria-hidden className="size-2 rounded-full" style={{ background: TYPE_COLOR[focus.type] ?? "#8C93A3" }} />
                      {entityLabel(focus)}
                      <span className="num text-[10px] font-normal text-ink-faint">{focus.type} · #{focus.id}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    {(["out", "inn"] as const).map((dir) => {
                      const list = edgesOf(focus.id)[dir];
                      if (list.length === 0) return null;
                      return (
                        <div key={dir}>
                          <p className="microlabel mb-2">{dir === "out" ? "Conecta a" : "Recebe de"}</p>
                          <div className="flex flex-col gap-1.5">
                            {list.slice(0, 12).map((edge) => {
                              const other = byId.get(dir === "out" ? edge.dst_id : edge.src_id);
                              if (!other) return null;
                              return (
                                <Link
                                  key={edge.id}
                                  href={hrefWith({ focus: String(other.id) })}
                                  className="flex items-center justify-between gap-3 rounded-md border border-line px-2.5 py-1.5 text-[13px] transition-colors hover:border-line-strong"
                                >
                                  <span className="flex min-w-0 items-center gap-2 text-ink">
                                    <span className="num shrink-0 rounded-sm bg-surface-3 px-1 py-0.5 text-[10px] text-ink-faint">{edge.rel}</span>
                                    <span className="truncate">{entityLabel(other)}</span>
                                  </span>
                                  {edge.weight != null ? <span className="num shrink-0 text-[11px] text-neon">{edge.weight.toFixed(2)}</span> : null}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {edgesOf(focus.id).out.length === 0 && edgesOf(focus.id).inn.length === 0 ? (
                      <p className="py-4 text-center text-xs text-ink-faint">Entidade sem conexões registradas.</p>
                    ) : null}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Padrões mais fortes</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-1.5">
                    {topEdges.length === 0 ? (
                      <p className="py-4 text-center text-xs text-ink-faint">Sem conexões ponderadas ainda.</p>
                    ) : (
                      topEdges.map((edge) => {
                        const src = byId.get(edge.src_id);
                        const dst = byId.get(edge.dst_id);
                        if (!src || !dst) return null;
                        return (
                          <div key={edge.id} className="rounded-md border border-line px-3 py-2">
                            <div className="flex items-center justify-between gap-3 text-[13px]">
                              <span className="flex min-w-0 items-center gap-2 text-ink">
                                <Link href={hrefWith({ focus: String(src.id) })} className="truncate hover:text-neon">
                                  {entityLabel(src)}
                                </Link>
                                <ArrowRight className="size-3 shrink-0 text-ink-faint" aria-hidden />
                                <Link href={hrefWith({ focus: String(dst.id) })} className="truncate hover:text-neon">
                                  {entityLabel(dst)}
                                </Link>
                              </span>
                              <span className="num shrink-0 text-[11px] text-neon">{edge.weight?.toFixed(2) ?? "—"}</span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-2">
                              <span className="num w-16 shrink-0 text-[10px] uppercase text-ink-faint">{edge.rel}</span>
                              <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
                                <div
                                  className="h-full rounded-full bg-neon/70"
                                  style={{ width: `${((edge.weight ?? 0) / maxWeight) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
