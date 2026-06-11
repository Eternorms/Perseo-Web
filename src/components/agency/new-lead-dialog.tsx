"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createLeadAction } from "@/lib/actions/leads";
import type { FormState } from "@/lib/actions/clients";
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { LEAD_STATUS } from "@/lib/labels";

const INITIAL: FormState = { error: null };

export function NewLeadDialog({
  clientId,
  clients,
}: {
  clientId?: string;
  /** quando aberto fora do contexto de um cliente (ex.: funis) */
  clients?: Array<{ id: string; name: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createLeadAction, INITIAL);

  useEffect(() => {
    if (state.ok) {
      toast.success("Lead criado.");
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="primary" size="sm" />}>
        <Plus /> Novo lead
      </DialogTrigger>
      <DialogContent title="Novo lead" description="Entrada manual — leads do Meta entram sozinhos via integração.">
        <form action={formAction} className="flex flex-col gap-4">
          {clientId ? (
            <input type="hidden" name="client_id" value={clientId} />
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nl-client">Cliente</Label>
              <NativeSelect id="nl-client" name="client_id" required defaultValue="">
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
              <Label htmlFor="nl-name">Nome</Label>
              <Input id="nl-name" name="name" required autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nl-phone">Telefone</Label>
              <Input id="nl-phone" name="phone" required placeholder="+55 11 9…" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nl-email">E-mail (opcional)</Label>
              <Input id="nl-email" name="email" type="email" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nl-status">Status</Label>
              <NativeSelect id="nl-status" name="status" defaultValue="new">
                {Object.entries(LEAD_STATUS).map(([value, def]) => (
                  <option key={value} value={value}>
                    {def.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nl-notes">Notas</Label>
            <Textarea id="nl-notes" name="notes" rows={2} />
          </div>
          <input type="hidden" name="source" value="manual" />

          {state.error ? (
            <p role="alert" className="rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button variant="primary" type="submit" disabled={pending}>
              {pending ? "Criando…" : "Criar lead →"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
