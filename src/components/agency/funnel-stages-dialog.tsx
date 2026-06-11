"use client";

import { useActionState, useState } from "react";
import { Settings2 } from "lucide-react";
import { saveFunnelStagesAction } from "@/lib/actions/funnel";
import type { FormState } from "@/lib/actions/clients";
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

const INITIAL: FormState = { error: null };

interface StageDraft {
  value: string;
  label: string;
  color: string;
}

/**
 * Personalização cosmética das etapas (rótulo + cor) por cliente.
 * Os valores internos seguem o ciclo de vida do lead (new→…→lost).
 */
export function FunnelStagesDialog({ clientId, stages }: { clientId: string; stages: StageDraft[] }) {
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<StageDraft[]>(stages);
  const [prevStages, setPrevStages] = useState(stages);
  if (prevStages !== stages) {
    // sincroniza os drafts quando o server component re-renderiza com novas etapas
    setPrevStages(stages);
    setDrafts(stages);
  }

  const [state, formAction, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const result = await saveFunnelStagesAction(prev, fd);
    if (result.ok) {
      toast.success("Funil atualizado.");
      setOpen(false);
    }
    return result;
  }, INITIAL);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Settings2 /> Etapas
      </DialogTrigger>
      <DialogContent
        title="Personalizar etapas do funil"
        description="Renomeie e recolora as etapas para falar a língua deste cliente."
      >
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="stages" value={JSON.stringify(drafts)} />
          {drafts.map((stage, i) => (
            <div key={stage.value} className="grid grid-cols-[90px_1fr_56px] items-center gap-2.5">
              <span className="num text-[11px] text-ink-faint">{stage.value}</span>
              <Input
                aria-label={`Rótulo da etapa ${stage.value}`}
                value={stage.label}
                onChange={(e) => setDrafts((d) => d.map((s, j) => (j === i ? { ...s, label: e.target.value } : s)))}
              />
              <input
                type="color"
                aria-label={`Cor da etapa ${stage.value}`}
                value={stage.color}
                onChange={(e) => setDrafts((d) => d.map((s, j) => (j === i ? { ...s, color: e.target.value } : s)))}
                className="h-9 w-full cursor-pointer rounded-md border border-line bg-surface-1 p-1"
              />
            </div>
          ))}

          {state.error ? (
            <p role="alert" className="rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button variant="primary" type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Salvar etapas"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
