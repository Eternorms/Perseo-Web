"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { createClientAction, type FormState } from "@/lib/actions/clients";
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { CLIENT_STATUS } from "@/lib/labels";

const INITIAL: FormState = { error: null };

export function NewClientDialog() {
  const [state, formAction, pending] = useActionState(createClientAction, INITIAL);

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="primary" size="sm" />}>
        <Plus /> Novo cliente
      </DialogTrigger>
      <DialogContent title="Novo cliente" description="O restante (integrações, agente, ponte de produção) é configurado no detalhe.">
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nc-name">Nome da marca</Label>
              <Input id="nc-name" name="name" required autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nc-business">Razão social</Label>
              <Input id="nc-business" name="business_name" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nc-status">Status</Label>
              <NativeSelect id="nc-status" name="status" defaultValue="onboarding">
                {Object.entries(CLIENT_STATUS).map(([value, def]) => (
                  <option key={value} value={value}>
                    {def.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nc-plan">Plano</Label>
              <NativeSelect id="nc-plan" name="plan" defaultValue="starter">
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="full_funnel">Full-Funnel</option>
                <option value="a_la_carte">À la carte</option>
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nc-value">Mensalidade (R$)</Label>
              <Input id="nc-value" name="monthly_value" type="number" min="0" step="0.01" placeholder="0,00" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nc-contact">Contato</Label>
              <Input id="nc-contact" name="contact_name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nc-email">E-mail do contato</Label>
              <Input id="nc-email" name="contact_email" type="email" />
            </div>
          </div>

          {state.error ? (
            <p role="alert" className="rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button variant="primary" type="submit" disabled={pending}>
              {pending ? "Criando…" : "Criar cliente →"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
