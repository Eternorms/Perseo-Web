"use client";

import { useActionState, useEffect } from "react";
import { deleteClientAction, updateClientAction, type FormState } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { CLIENT_STATUS, SERVICE_LABEL } from "@/lib/labels";
import type { ClientRow } from "@/types/database";

const INITIAL: FormState = { error: null };

export function ClientEditForm({ client, canDelete }: { client: ClientRow; canDelete: boolean }) {
  const [state, formAction, pending] = useActionState(updateClientAction, INITIAL);

  useEffect(() => {
    if (state.ok) toast.success("Cliente atualizado.");
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4 xl:grid-cols-2">
      <input type="hidden" name="id" value={client.id} />

      <Card>
        <CardHeader>
          <CardTitle>Marca & comercial</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome da marca" id="name">
            <Input id="name" name="name" required defaultValue={client.name} />
          </Field>
          <Field label="Razão social" id="business_name">
            <Input id="business_name" name="business_name" required defaultValue={client.business_name} />
          </Field>
          <Field label="Nicho" id="niche">
            <Input id="niche" name="niche" defaultValue={client.niche ?? ""} />
          </Field>
          <Field label="Status" id="status">
            <NativeSelect id="status" name="status" defaultValue={client.status}>
              {Object.entries(CLIENT_STATUS).map(([value, def]) => (
                <option key={value} value={value}>
                  {def.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Plano" id="plan">
            <NativeSelect id="plan" name="plan" defaultValue={client.plan ?? "starter"}>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="full_funnel">Full-Funnel</option>
              <option value="a_la_carte">À la carte</option>
              <option value="white_label">White-label</option>
            </NativeSelect>
          </Field>
          <Field label="Mensalidade (R$)" id="monthly_value">
            <Input id="monthly_value" name="monthly_value" type="number" min="0" step="0.01" defaultValue={client.monthly_value ?? ""} />
          </Field>
          <fieldset className="sm:col-span-2">
            <legend className="mb-1.5 block text-xs font-medium text-ink-mute">Serviços</legend>
            <div className="flex gap-4">
              {(["traffic", "content"] as const).map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" name="services" value={s} defaultChecked={(client.services ?? []).includes(s)} className="size-4 accent-[#00FF41]" />
                  {SERVICE_LABEL[s]}
                </label>
              ))}
            </div>
          </fieldset>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contato & integrações</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Contato" id="contact_name">
            <Input id="contact_name" name="contact_name" defaultValue={client.contact_name ?? ""} />
          </Field>
          <Field label="E-mail" id="contact_email">
            <Input id="contact_email" name="contact_email" type="email" defaultValue={client.contact_email ?? ""} />
          </Field>
          <Field label="Telefone" id="contact_phone">
            <Input id="contact_phone" name="contact_phone" defaultValue={client.contact_phone ?? ""} />
          </Field>
          <Field label="WhatsApp (tipo)" id="whatsapp_type">
            <NativeSelect id="whatsapp_type" name="whatsapp_type" defaultValue={client.whatsapp_type ?? ""}>
              <option value="">Não configurado</option>
              <option value="evolution">Evolution</option>
              <option value="meta">Meta Cloud</option>
            </NativeSelect>
          </Field>
          <Field label="Instância Evolution" id="whatsapp_instance">
            <Input id="whatsapp_instance" name="whatsapp_instance" defaultValue={client.whatsapp_instance ?? ""} />
          </Field>
          <Field label="Número WhatsApp" id="whatsapp_phone">
            <Input id="whatsapp_phone" name="whatsapp_phone" defaultValue={client.whatsapp_phone ?? ""} />
          </Field>
          <Field label="Meta page_id" id="meta_page_id">
            <Input id="meta_page_id" name="meta_page_id" defaultValue={client.meta_page_id ?? ""} />
          </Field>
          <Field label="Meta form_id" id="meta_form_id">
            <Input id="meta_form_id" name="meta_form_id" defaultValue={client.meta_form_id ?? ""} />
          </Field>
          <Field label="Instagram page_id" id="ig_page_id">
            <Input id="ig_page_id" name="ig_page_id" defaultValue={client.ig_page_id ?? ""} />
          </Field>
          <Field label="Meta token" id="meta_token">
            <Input id="meta_token" name="meta_token" type="password" defaultValue={client.meta_token ?? ""} />
          </Field>
          <Field label="Google Calendar ID" id="calendar_id">
            <Input id="calendar_id" name="calendar_id" defaultValue={client.calendar_id ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ponte com o Perseo Produção</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label="ID no engine (perseo_client_id)"
            id="perseo_client_id"
            hint="ID numérico do cliente no app desktop. Liga criativos, resultados e knowledge graph a esta conta."
          >
            <Input id="perseo_client_id" name="perseo_client_id" type="number" min="1" defaultValue={client.perseo_client_id ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agente de IA</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field label="Prompt do agente" id="agent_prompt">
            <Textarea id="agent_prompt" name="agent_prompt" rows={6} defaultValue={client.agent_prompt ?? ""} />
          </Field>
          <label className="flex items-center justify-between gap-4 rounded-md border border-line px-3.5 py-3">
            <span className="text-sm text-ink">Agente ativo</span>
            <Switch name="agent_active" defaultChecked={client.agent_active} />
          </label>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3 xl:col-span-2">
        {canDelete ? (
          <Button
            variant="danger"
            size="sm"
            type="submit"
            formAction={deleteClientAction}
            formNoValidate
            onClick={(e) => {
              if (!window.confirm(`Excluir ${client.name}? Leads, agendamentos e mensagens serão apagados.`)) e.preventDefault();
            }}
          >
            Excluir cliente
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          {state.error ? (
            <p role="alert" className="text-xs text-loss">
              {state.error}
            </p>
          ) : null}
          <Button variant="primary" type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, id, children, hint }: { label: string; id: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-ink-faint">{hint}</p> : null}
    </div>
  );
}
