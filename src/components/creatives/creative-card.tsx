"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarClock, Check, Clapperboard, RotateCcw, X } from "lucide-react";
import { decideCreativeAction, scheduleCreativeAction, type CreativeDecisionState } from "@/lib/actions/creatives";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/kit/status-badge";
import { toast } from "@/components/ui/toast";
import { CREATIVE_STATUS } from "@/lib/labels";
import { fmtDateTime, fmtRelative } from "@/lib/format";
import type { CreativeApprovalRow, CreativeStatus } from "@/types/perseo";
import { cn } from "@/lib/utils";

const INITIAL: CreativeDecisionState = { error: null };

export function CreativeCard({
  creative,
  mode,
  clientName,
}: {
  creative: CreativeApprovalRow;
  mode: "agency" | "client";
  /** visão agência multi-cliente */
  clientName?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface-2 text-left transition-colors hover:border-line-strong"
          />
        }
      >
        <Thumb creative={creative} />
        <span className="flex flex-1 flex-col gap-1 p-3">
          <span className="line-clamp-1 text-[13px] font-medium text-ink">{creative.title ?? `Criativo #${creative.id}`}</span>
          <span className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-ink-faint">
              {clientName ? `${clientName} · ` : ""}
              {creative.submitted_at ? fmtRelative(creative.submitted_at) : "—"}
            </span>
            <StatusBadge def={CREATIVE_STATUS[creative.status]} />
          </span>
        </span>
      </DialogTrigger>

      <CreativeSheetBody creative={creative} mode={mode} clientName={clientName} />
    </Dialog>
  );
}

/** Drawer controlado — para abrir a partir de linhas de tabela (studio). */
export function CreativeDetailSheet({
  creative,
  mode,
  clientName,
  open,
  onOpenChange,
}: {
  creative: CreativeApprovalRow;
  mode: "agency" | "client";
  clientName?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <CreativeSheetBody creative={creative} mode={mode} clientName={clientName} />
    </Dialog>
  );
}

function CreativeSheetBody({
  creative,
  mode,
  clientName,
}: {
  creative: CreativeApprovalRow;
  mode: "agency" | "client";
  clientName?: string;
}) {
  return (
    <SheetContent
      wide
      title={creative.title ?? `Criativo #${creative.id}`}
      description={clientName ? `${clientName} · enviado ${fmtRelative(creative.submitted_at)}` : `Enviado ${fmtRelative(creative.submitted_at)}`}
    >
      <div className="flex flex-col gap-5 lg:flex-row">
        <Player creative={creative} />
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex items-center justify-between">
            <StatusBadge def={CREATIVE_STATUS[creative.status]} />
            {creative.decided_at ? (
              <span className="num text-[11px] text-ink-faint">decidido {fmtRelative(creative.decided_at)}</span>
            ) : null}
          </div>

          {creative.description ? (
            <div>
              <p className="microlabel mb-1.5">Roteiro / descrição</p>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-mute">{creative.description}</p>
            </div>
          ) : null}

          {creative.client_feedback ? (
            <div className="rounded-md border border-info/25 bg-info/5 p-3">
              <p className="microlabel mb-1 text-info">Feedback do cliente</p>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{creative.client_feedback}</p>
            </div>
          ) : null}

          {mode === "client" ? <DecisionForm creative={creative} /> : <AgencyPanel creative={creative} />}
        </div>
      </div>
    </SheetContent>
  );
}

function Thumb({ creative }: { creative: CreativeApprovalRow }) {
  return (
    <span className="relative block aspect-[9/16] max-h-72 w-full overflow-hidden bg-surface-1">
      {creative.thumbnail_url ? (
        <img
          src={creative.thumbnail_url}
          alt=""
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
      ) : (
        <span className="flex size-full items-center justify-center">
          <Clapperboard className="size-8 text-ink-faint" aria-hidden />
        </span>
      )}
      {creative.scheduled_at ? (
        <span className="num absolute bottom-2 left-2 flex items-center gap-1 rounded-sm bg-black/70 px-1.5 py-0.5 text-[10px] text-ink">
          <CalendarClock className="size-3" aria-hidden /> {fmtDateTime(creative.scheduled_at)}
        </span>
      ) : null}
    </span>
  );
}

function Player({ creative }: { creative: CreativeApprovalRow }) {
  return (
    <div className="mx-auto w-full max-w-60 shrink-0 lg:mx-0">
      <div className="overflow-hidden rounded-lg border border-line bg-black">
        {creative.media_url ? (
          <video
            src={creative.media_url}
            poster={creative.thumbnail_url ?? undefined}
            controls
            playsInline
            preload="metadata"
            className="aspect-[9/16] w-full object-contain"
          />
        ) : (
          <div className="flex aspect-[9/16] items-center justify-center text-xs text-ink-faint">Mídia indisponível</div>
        )}
      </div>
    </div>
  );
}

/** Portal do cliente: aprovar / revisar / rejeitar + feedback. */
function DecisionForm({ creative }: { creative: CreativeApprovalRow }) {
  const [state, formAction, pending] = useActionState(decideCreativeAction, INITIAL);
  const [decision, setDecision] = useState<CreativeStatus | null>(null);

  useEffect(() => {
    if (state.ok) toast.success("Decisão registrada — a Perseo já foi avisada.");
  }, [state]);

  if (creative.status === "approved" || (creative.status === "rejected" && !state.ok)) {
    if (creative.status === "approved") {
      return (
        <p className="rounded-md border border-neon/25 bg-neon/5 px-3 py-2.5 text-[13px] text-ink">
          Aprovado{creative.scheduled_at ? ` — publicação agendada para ${fmtDateTime(creative.scheduled_at)}.` : ". A agência vai agendar a publicação."}
        </p>
      );
    }
  }

  const needsFeedback = decision === "revision" || decision === "rejected";

  return (
    <form action={formAction} className="flex flex-col gap-3 border-t border-line pt-4">
      <input type="hidden" name="creative_id" value={creative.id} />
      <input type="hidden" name="decision" value={decision ?? ""} />
      <p className="microlabel">Sua decisão</p>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Decisão sobre o criativo">
        <DecisionChip active={decision === "approved"} onClick={() => setDecision("approved")} icon={Check} label="Aprovar" tone="neon" />
        <DecisionChip active={decision === "revision"} onClick={() => setDecision("revision")} icon={RotateCcw} label="Revisar" tone="info" />
        <DecisionChip active={decision === "rejected"} onClick={() => setDecision("rejected")} icon={X} label="Rejeitar" tone="loss" />
      </div>
      <div className={cn("flex flex-col gap-1.5", !needsFeedback && decision !== null && "opacity-60")}>
        <Label htmlFor={`fb-${creative.id}`}>
          Feedback {needsFeedback ? "(obrigatório)" : "(opcional)"}
        </Label>
        <Textarea
          id={`fb-${creative.id}`}
          name="feedback"
          rows={3}
          required={needsFeedback}
          placeholder={needsFeedback ? "O que precisa mudar? Seja específico — vira instrução de edição." : "Algum comentário?"}
        />
      </div>
      {state.error ? (
        <p role="alert" className="rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss">
          {state.error}
        </p>
      ) : null}
      <Button variant="primary" type="submit" disabled={pending || decision === null}>
        {pending ? "Enviando…" : "Confirmar decisão →"}
      </Button>
    </form>
  );
}

function DecisionChip({
  active,
  onClick,
  icon: Icon,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  tone: "neon" | "info" | "loss";
}) {
  const activeClass = {
    neon: "border-neon/50 bg-neon/10 text-neon",
    info: "border-info/50 bg-info/10 text-info",
    loss: "border-loss/50 bg-loss/10 text-loss",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs font-medium transition-colors",
        active ? activeClass : "border-line text-ink-mute hover:border-line-strong hover:text-ink",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </button>
  );
}

/** Visão agência: agendar publicação de aprovado + decidir em nome do cliente. */
function AgencyPanel({ creative }: { creative: CreativeApprovalRow }) {
  const [state, formAction, pending] = useActionState(scheduleCreativeAction, INITIAL);

  useEffect(() => {
    if (state.ok) toast.success("Publicação agendada.");
  }, [state]);

  return (
    <div className="flex flex-col gap-5 border-t border-line pt-4">
      {creative.status === "approved" ? (
        <form action={formAction} className="flex flex-col gap-3">
          <p className="microlabel">Agendar publicação</p>
          <input type="hidden" name="creative_id" value={creative.id} />
          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor={`sch-${creative.id}`}>Data e hora</Label>
              <Input
                id={`sch-${creative.id}`}
                name="scheduled_at"
                type="datetime-local"
                defaultValue={creative.scheduled_at ? creative.scheduled_at.slice(0, 16) : ""}
              />
            </div>
            <Button variant="primary" type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Agendar"}
            </Button>
          </div>
          {creative.meta_post_id ? (
            <p className="num text-[11px] text-ink-faint">meta_post_id: {creative.meta_post_id}</p>
          ) : null}
          {state.error ? (
            <p role="alert" className="text-xs text-loss">
              {state.error}
            </p>
          ) : null}
        </form>
      ) : (
        <p className="text-[13px] leading-relaxed text-ink-mute">
          {creative.status === "pending"
            ? "Aguardando decisão do cliente no portal. Se necessário, você pode decidir em nome dele abaixo."
            : creative.status === "revision"
              ? "Cliente pediu revisão — o pipeline de produção recebe o feedback como instrução."
              : "Criativo rejeitado pelo cliente."}
        </p>
      )}

      {creative.status === "pending" || creative.status === "revision" ? <DecisionForm creative={creative} /> : null}
    </div>
  );
}
