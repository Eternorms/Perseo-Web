"use client";

import { useTransition } from "react";
import { Check, Flag, X } from "lucide-react";
import { updateAgentActionStatusAction } from "@/lib/actions/agent";
import { AGENT_ACTION, AGENT_ACTION_STATUS } from "@/lib/labels";
import { fmtDateTime, fmtRelative } from "@/lib/format";
import { StatusBadge } from "@/components/kit/status-badge";
import { toast } from "@/components/ui/toast";
import type { AgentActionRow, AgentActionStatus } from "@/types/database";
import { cn } from "@/lib/utils";

type Row = AgentActionRow & { clients?: { name: string } | null };

/** Fila de solicitações ao agente — a agência aprova; o agente/desktop executa. */
export function AgentActionsList({ actions }: { actions: Row[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {actions.map((action) => (
        <AgentActionItem key={action.id} action={action} />
      ))}
    </div>
  );
}

function AgentActionItem({ action }: { action: Row }) {
  const [pending, startTransition] = useTransition();
  const payload = (action.payload ?? {}) as {
    patient_name?: string;
    current_at?: string;
    preferred_at?: string;
    note?: string;
  };

  function move(status: AgentActionStatus, message: string) {
    const fd = new FormData();
    fd.set("id", action.id);
    fd.set("status", status);
    startTransition(async () => {
      await updateAgentActionStatusAction(fd);
      toast.success(message);
    });
  }

  return (
    <div className={cn("rounded-md border border-line px-3 py-2.5", pending && "opacity-50")}>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-[13px] font-medium text-ink">
          {AGENT_ACTION[action.action_type]}
          {payload.patient_name ? ` · ${payload.patient_name}` : ""}
        </p>
        <StatusBadge def={AGENT_ACTION_STATUS[action.status]} />
      </div>
      <p className="num mt-0.5 text-[11px] text-ink-faint">
        {action.clients?.name ?? "—"}
        {payload.current_at ? ` · de ${fmtDateTime(payload.current_at)}` : ""}
        {payload.preferred_at ? ` → ${fmtDateTime(payload.preferred_at)}` : ""}
        {` · ${fmtRelative(action.created_at)}`}
      </p>
      {payload.note ? <p className="mt-1 text-[11px] text-ink-mute">“{payload.note}”</p> : null}

      <div className="mt-2 flex items-center gap-1.5">
        {action.status === "pending" ? (
          <ActionButton onClick={() => move("approved", "Solicitação aprovada — agente liberado.")} disabled={pending} tone="neon">
            <Check className="size-3" aria-hidden /> Aprovar
          </ActionButton>
        ) : null}
        {action.status === "approved" ? (
          <>
            <ActionButton onClick={() => move("executed", "Marcada como executada.")} disabled={pending} tone="neon">
              <Check className="size-3" aria-hidden /> Concluída
            </ActionButton>
            <ActionButton onClick={() => move("failed", "Marcada como falha.")} disabled={pending} tone="loss">
              <Flag className="size-3" aria-hidden /> Falhou
            </ActionButton>
          </>
        ) : null}
        {action.status === "pending" || action.status === "approved" ? (
          <ActionButton onClick={() => move("cancelled", "Solicitação cancelada.")} disabled={pending} tone="neutral">
            <X className="size-3" aria-hidden /> Cancelar
          </ActionButton>
        ) : null}
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  tone,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  tone: "neon" | "loss" | "neutral";
  children: React.ReactNode;
}) {
  const toneClass = {
    neon: "border-neon/30 text-neon hover:bg-neon/10",
    loss: "border-loss/30 text-loss hover:bg-loss/10",
    neutral: "border-line-strong text-ink-mute hover:bg-surface-3 hover:text-ink",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-[11px] font-medium transition-colors disabled:pointer-events-none",
        toneClass,
      )}
    >
      {children}
    </button>
  );
}
