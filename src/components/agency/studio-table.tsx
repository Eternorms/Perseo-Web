"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { CreativeDetailSheet } from "@/components/creatives/creative-card";
import { StatusBadge } from "@/components/kit/status-badge";
import { Sparkline } from "@/components/charts/sparkline";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CREATIVE_STATUS } from "@/lib/labels";
import { fmtCurrency, fmtDateShort, fmtRoas } from "@/lib/format";
import type { CreativeApprovalRow, CreativeStatus } from "@/types/perseo";
import { cn } from "@/lib/utils";

export interface StudioRow {
  creative: CreativeApprovalRow;
  clientName: string;
  adjRoas: number | null;
  spend7: number | null;
  series: number[];
  winner: boolean;
}

const STATUS_FILTERS: Array<{ value: CreativeStatus | "all"; label: string }> = [
  { value: "all", label: "todos" },
  { value: "pending", label: "aguardando" },
  { value: "revision", label: "revisão" },
  { value: "approved", label: "aprovados" },
  { value: "rejected", label: "rejeitados" },
];

/** Tabela densa do command center — filtro local, drawer por linha. */
export function StudioTable({ creatives }: { creatives: StudioRow[] }) {
  const [status, setStatus] = React.useState<CreativeStatus | "all">("all");
  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState<StudioRow | null>(null);

  const filtered = creatives.filter((row) => {
    if (status !== "all" && row.creative.status !== status) return false;
    if (q) {
      const target = `${row.creative.title ?? ""} ${row.clientName}`.toLowerCase();
      if (!target.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1" role="group" aria-label="Filtrar por status">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              aria-pressed={status === f.value}
              className={cn(
                "num rounded-md border px-2.5 py-1 text-[11px] uppercase tracking-wide transition-colors",
                status === f.value ? "border-neon/40 bg-neon/10 text-neon" : "border-line text-ink-faint hover:border-line-strong hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-56">
          <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
          <Input
            type="search"
            aria-label="Buscar criativo"
            placeholder="Buscar título ou cliente…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface-1/80">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-line">
              <th className="microlabel px-3 py-2 text-left font-normal">ID</th>
              <th className="microlabel px-3 py-2 text-left font-normal">Cliente</th>
              <th className="microlabel px-3 py-2 text-left font-normal">Criativo</th>
              <th className="microlabel px-3 py-2 text-left font-normal">Status</th>
              <th className="microlabel px-3 py-2 text-right font-normal">Submetido</th>
              <th className="microlabel px-3 py-2 text-right font-normal">Publicação</th>
              <th className="microlabel px-3 py-2 text-right font-normal">Spend 7d</th>
              <th className="microlabel px-3 py-2 text-right font-normal">ROAS aj.</th>
              <th className="microlabel px-3 py-2 text-left font-normal">Tendência</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.creative.id}
                onClick={() => setSelected(row)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSelected(row);
                }}
                tabIndex={0}
                aria-label={`Abrir ${row.creative.title ?? `criativo ${row.creative.id}`}`}
                className="h-10 cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-surface-3/60 focus-visible:bg-surface-3/60 focus-visible:outline-none"
              >
                <td className="num px-3 text-ink-faint">#{row.creative.id}</td>
                <td className="px-3 text-ink-mute">{row.clientName}</td>
                <td className="max-w-64 truncate px-3 font-medium text-ink">
                  {row.creative.title ?? `Criativo #${row.creative.id}`}
                  {row.winner ? <Badge tone="neon" className="ml-2">VENCEDOR</Badge> : null}
                </td>
                <td className="px-3">
                  <StatusBadge def={CREATIVE_STATUS[row.creative.status]} />
                </td>
                <td className="num px-3 text-right text-ink-mute">{fmtDateShort(row.creative.submitted_at)}</td>
                <td className="num px-3 text-right text-ink-mute">
                  {row.creative.scheduled_at ? fmtDateShort(row.creative.scheduled_at) : "—"}
                </td>
                <td className="num px-3 text-right text-ink-mute">{row.spend7 != null ? fmtCurrency(row.spend7) : "—"}</td>
                <td className={cn("num px-3 text-right", row.winner ? "text-neon" : "text-ink")}>{fmtRoas(row.adjRoas)}</td>
                <td className="px-3">
                  <Sparkline points={row.series} color={row.winner ? "#00FF41" : "#5BA3FF"} width={80} height={20} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-xs text-ink-faint">
                  Nenhum criativo nesse filtro.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selected ? (
        <CreativeDetailSheet
          creative={selected.creative}
          clientName={selected.clientName}
          mode="agency"
          open={Boolean(selected)}
          onOpenChange={(v) => !v && setSelected(null)}
        />
      ) : null}
    </div>
  );
}
