"use client";

import { useActionState, useState } from "react";
import { CalendarClock } from "lucide-react";
import { requestAgentActionAction, type AgentRequestState } from "@/lib/actions/agent";
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { fmtDateTime } from "@/lib/format";

const INITIAL: AgentRequestState = { error: null };

/**
 * Pedido de reagendamento via agente de IA — o agente contata o paciente
 * no WhatsApp e a agência acompanha o ciclo no dashboard.
 */
export function RescheduleDialog({
  appointmentId,
  patientName,
  scheduledAt,
}: {
  appointmentId: string;
  patientName: string;
  scheduledAt: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (prev: AgentRequestState, fd: FormData) => {
    const result = await requestAgentActionAction(prev, fd);
    if (result.ok) {
      toast.success("Solicitação enviada — o agente cuida do contato.");
      setOpen(false);
    }
    return result;
  }, INITIAL);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <CalendarClock /> Reagendar
      </DialogTrigger>
      <DialogContent
        title="Pedir reagendamento"
        description={`${patientName} · atualmente ${fmtDateTime(scheduledAt)}. O agente negocia o novo horário no WhatsApp.`}
      >
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="action_type" value="reschedule" />
          <input type="hidden" name="appointment_id" value={appointmentId} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`rs-when-${appointmentId}`}>Nova data e hora preferida</Label>
            <Input id={`rs-when-${appointmentId}`} name="preferred_at" type="datetime-local" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`rs-note-${appointmentId}`}>Observação (opcional)</Label>
            <Textarea
              id={`rs-note-${appointmentId}`}
              name="note"
              rows={2}
              placeholder="Ex.: paciente prefere período da tarde."
            />
          </div>

          {state.error ? (
            <p role="alert" className="rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button variant="primary" type="submit" disabled={pending}>
              {pending ? "Enviando…" : "Solicitar ao agente →"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
