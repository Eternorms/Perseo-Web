"use client";

import { useActionState } from "react";
import { updateClientSettingsAction, type SettingsFormState } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import type { ClientRow } from "@/types/database";

const INITIAL: SettingsFormState = { error: null };

export function SettingsForm({ client }: { client: ClientRow }) {
  const [state, formAction, pending] = useActionState(async (prev: SettingsFormState, fd: FormData) => {
    const result = await updateClientSettingsAction(prev, fd);
    if (result.ok) toast.success("Configurações salvas.");
    return result;
  }, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Dados da marca</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-name">Nome da marca</Label>
            <Input id="st-name" name="name" required defaultValue={client.name} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-business">Razão social</Label>
            <Input id="st-business" name="business_name" required defaultValue={client.business_name} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-niche">Nicho</Label>
            <Input id="st-niche" name="niche" defaultValue={client.niche ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-contact">Contato principal</Label>
            <Input id="st-contact" name="contact_name" defaultValue={client.contact_name ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-email">E-mail</Label>
            <Input id="st-email" name="contact_email" type="email" defaultValue={client.contact_email ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-phone">Telefone</Label>
            <Input id="st-phone" name="contact_phone" defaultValue={client.contact_phone ?? ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agente de IA</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="st-prompt">Prompt do agente</Label>
            <Textarea
              id="st-prompt"
              name="agent_prompt"
              rows={6}
              defaultValue={client.agent_prompt ?? ""}
              placeholder="Como o agente deve falar com seus leads: tom, regras, limites…"
            />
            <p className="text-[11px] leading-relaxed text-ink-faint">
              O agente usa essas instruções ao responder leads no WhatsApp. Mudanças valem para as próximas conversas.
            </p>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-md border border-line px-3.5 py-3">
            <span className="text-sm text-ink">Agente ativo</span>
            <Switch name="agent_active" defaultChecked={client.agent_active} />
          </label>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {state.error ? (
          <p role="alert" className="text-xs text-loss">
            {state.error}
          </p>
        ) : null}
        <Button variant="primary" type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar configurações"}
        </Button>
      </div>
    </form>
  );
}
