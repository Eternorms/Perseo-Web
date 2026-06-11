"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createAppointmentAction } from "@/lib/actions/appointments";
import type { FormState } from "@/lib/actions/clients";
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";

const INITIAL: FormState = { error: null };

export function NewAppointmentDialog({
  clientId,
  clients,
  leads,
}: {
  clientId?: string;
  clients?: Array<{ id: string; name: string }>;
  leads?: Array<{ id: string; name: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createAppointmentAction, INITIAL);

  useEffect(() => {
    if (state.ok) {
      toast.success("Agendamento criado — cliente notificado.");
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="primary" size="sm" />}>
        <Plus /> Novo agendamento
      </DialogTrigger>
      <DialogContent title="Novo agendamento" description="Gera notificação automática no portal do cliente.">
        <form action={formAction} className="flex flex-col gap-4">
          {clientId ? (
            <input type="hidden" name="client_id" value={clientId} />
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="na-client">Cliente</Label>
              <NativeSelect id="na-client" name="client_id" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {(clients ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="na-name">Nome (paciente/contato)</Label>
              <Input id="na-name" name="patient_name" required autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="na-phone">Telefone</Label>
              <Input id="na-phone" name="patient_phone" placeholder="+55 11 9…" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="na-when">Data e hora</Label>
              <Input id="na-when" name="scheduled_at" type="datetime-local" required />
            </div>
            {leads && leads.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="na-lead">Lead de origem (opcional)</Label>
                <NativeSelect id="na-lead" name="lead_id" defaultValue="">
                  <option value="">Nenhum</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="na-notes">Notas</Label>
            <Textarea id="na-notes" name="notes" rows={2} />
          </div>

          {state.error ? (
            <p role="alert" className="rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button variant="primary" type="submit" disabled={pending}>
              {pending ? "Criando…" : "Agendar →"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
