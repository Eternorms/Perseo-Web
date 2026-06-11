"use client";

import { useActionState, useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  finishOnboardingAction,
  saveOnboardingStepAction,
  skipOnboardingStepAction,
  type OnboardingFormState,
} from "@/lib/actions/onboarding";
import { SKIPPABLE_STEPS } from "@/lib/validation/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { SERVICE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { ClientRow } from "@/types/database";

const INITIAL: OnboardingFormState = { error: null };

const AGENT_PROMPT_PLACEHOLDER =
  "Ex.: Você é a assistente da [marca]. Responda leads em até 2 minutos, tom acolhedor e direto. Qualifique perguntando objetivo e urgência. Nunca prometa resultados. Ofereça os horários da agenda quando o lead demonstrar interesse.";

export function StepForm({ step, client }: { step: number; client: ClientRow }) {
  const [state, formAction, pending] = useActionState(
    step === 7 ? finishOnboardingAction : saveOnboardingStepAction,
    INITIAL,
  );

  return (
    <form action={formAction} className="max-w-xl">
      <input type="hidden" name="step" value={step} />
      <div className="flex flex-col gap-5">
        {step === 1 && <Step1 client={client} />}
        {step === 2 && <Step2 client={client} />}
        {step === 3 && <Step3 client={client} />}
        {step === 4 && <Step4 client={client} />}
        {step === 5 && <Step5 client={client} />}
        {step === 6 && <Step6 client={client} />}
        {step === 7 && <Step7 client={client} />}
      </div>

      {state.error ? (
        <p role="alert" className="mt-5 rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss">
          {state.error}
        </p>
      ) : null}

      <div className="mt-7 flex items-center justify-between gap-3 border-t border-line pt-5">
        <div>
          {step > 1 ? (
            <a
              href={`/onboarding?step=${step - 1}`}
              className="inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium text-ink-mute transition-colors hover:bg-surface-3 hover:text-ink [&_svg]:size-3.5"
            >
              <ArrowLeft /> Voltar
            </a>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {SKIPPABLE_STEPS.has(step) ? (
            <Button variant="ghost" size="sm" type="submit" formAction={skipOnboardingStepAction} formNoValidate>
              Configurar depois
            </Button>
          ) : null}
          <Button variant="primary" type="submit" disabled={pending}>
            {pending ? "Salvando…" : step === 7 ? "Ativar operação →" : "Continuar →"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-[11px] text-ink-faint">{hint}</p> : null}
    </div>
  );
}

function Step1({ client }: { client: ClientRow }) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome da marca" htmlFor="name">
          <Input id="name" name="name" required defaultValue={client.name === client.contact_email ? "" : client.name} />
        </Field>
        <Field label="Razão social" htmlFor="business_name">
          <Input id="business_name" name="business_name" required defaultValue={client.business_name} />
        </Field>
      </div>
      <Field label="Nicho" htmlFor="niche" hint="Ex.: skincare, suplementos, moda fitness.">
        <Input id="niche" name="niche" defaultValue={client.niche ?? ""} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Contato principal" htmlFor="contact_name">
          <Input id="contact_name" name="contact_name" required defaultValue={client.contact_name ?? ""} />
        </Field>
        <Field label="E-mail" htmlFor="contact_email">
          <Input id="contact_email" name="contact_email" type="email" required defaultValue={client.contact_email ?? ""} />
        </Field>
        <Field label="Telefone" htmlFor="contact_phone">
          <Input id="contact_phone" name="contact_phone" type="tel" required defaultValue={client.contact_phone ?? ""} placeholder="+55 11 9…" />
        </Field>
      </div>
    </>
  );
}

function Step2({ client }: { client: ClientRow }) {
  const [type, setType] = useState(client.whatsapp_type ?? "evolution");
  return (
    <>
      <fieldset>
        <legend className="mb-2 block text-xs font-medium text-ink-mute">Tipo de integração</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              { value: "evolution", title: "Evolution API", desc: "Instância própria — número comum, setup rápido." },
              { value: "meta", title: "WhatsApp Cloud (Meta)", desc: "API oficial da Meta — número verificado." },
            ] as const
          ).map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "cursor-pointer rounded-lg border p-3.5 transition-colors",
                type === opt.value ? "border-neon/50 bg-neon/5" : "border-line hover:border-line-strong",
              )}
            >
              <input
                type="radio"
                name="whatsapp_type"
                value={opt.value}
                checked={type === opt.value}
                onChange={() => setType(opt.value)}
                className="sr-only"
              />
              <span className="block text-sm font-medium text-ink">{opt.title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-ink-mute">{opt.desc}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {type === "evolution" ? (
        <Field label="Nome da instância Evolution" htmlFor="whatsapp_instance">
          <Input id="whatsapp_instance" name="whatsapp_instance" defaultValue={client.whatsapp_instance ?? ""} placeholder="ex.: perseo-minhamarca" />
        </Field>
      ) : null}
      <Field label="Número do WhatsApp" htmlFor="whatsapp_phone">
        <Input id="whatsapp_phone" name="whatsapp_phone" type="tel" required defaultValue={client.whatsapp_phone ?? ""} placeholder="+55 11 9…" />
      </Field>
    </>
  );
}

function Step3({ client }: { client: ClientRow }) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="ID da página (Meta)" htmlFor="meta_page_id">
          <Input id="meta_page_id" name="meta_page_id" defaultValue={client.meta_page_id ?? ""} />
        </Field>
        <Field label="ID do formulário de leads" htmlFor="meta_form_id">
          <Input id="meta_form_id" name="meta_form_id" defaultValue={client.meta_form_id ?? ""} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="ID do Instagram" htmlFor="ig_page_id">
          <Input id="ig_page_id" name="ig_page_id" defaultValue={client.ig_page_id ?? ""} />
        </Field>
        <Field label="Token de acesso (Meta)" htmlFor="meta_token" hint="Armazenado com acesso restrito — usado para captar leads e publicar.">
          <Input id="meta_token" name="meta_token" type="password" defaultValue={client.meta_token ?? ""} />
        </Field>
      </div>
    </>
  );
}

function Step4({ client }: { client: ClientRow }) {
  return (
    <Field label="ID da agenda (Google Calendar)" htmlFor="calendar_id" hint="Compartilhe a agenda com a Perseo e cole aqui o ID (algo como abc123@group.calendar.google.com).">
      <Input id="calendar_id" name="calendar_id" defaultValue={client.calendar_id ?? ""} />
    </Field>
  );
}

function Step5({ client }: { client: ClientRow }) {
  return (
    <>
      <Field label="Prompt do agente" htmlFor="agent_prompt" hint="Você poderá refinar a qualquer momento em Configurações.">
        <Textarea
          id="agent_prompt"
          name="agent_prompt"
          rows={7}
          defaultValue={client.agent_prompt ?? ""}
          placeholder={AGENT_PROMPT_PLACEHOLDER}
        />
      </Field>
      <label className="flex items-center justify-between gap-4 rounded-lg border border-line p-3.5">
        <span>
          <span className="block text-sm font-medium text-ink">Ativar agente de IA</span>
          <span className="mt-0.5 block text-xs text-ink-mute">Responde leads automaticamente no WhatsApp conectado.</span>
        </span>
        <Switch name="agent_active" defaultChecked={client.agent_active} />
      </label>
    </>
  );
}

function Step6({ client }: { client: ClientRow }) {
  const services = client.services ?? [];
  return (
    <fieldset>
      <legend className="mb-2 block text-xs font-medium text-ink-mute">Serviços contratados</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            { value: "traffic", desc: "Gestão de tráfego pago, leads e funil de conversão." },
            { value: "content", desc: "Criativos UGC, roteiros e publicação orgânica." },
          ] as const
        ).map((opt) => (
          <label key={opt.value} className="group cursor-pointer rounded-lg border border-line p-3.5 transition-colors hover:border-line-strong has-[:checked]:border-neon/50 has-[:checked]:bg-neon/5">
            <span className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">{SERVICE_LABEL[opt.value]}</span>
              <input
                type="checkbox"
                name="services"
                value={opt.value}
                defaultChecked={services.includes(opt.value)}
                className="size-4 accent-[#00FF41]"
              />
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-ink-mute">{opt.desc}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Step7({ client }: { client: ClientRow }) {
  const rows: Array<[string, string]> = [
    ["Marca", client.name || "—"],
    ["Razão social", client.business_name || "—"],
    ["Nicho", client.niche ?? "—"],
    ["Contato", client.contact_name ? `${client.contact_name} · ${client.contact_email ?? ""}` : "—"],
    ["WhatsApp", client.whatsapp_type ? `${client.whatsapp_type === "evolution" ? "Evolution" : "Meta Cloud"} · ${client.whatsapp_phone ?? "—"}` : "Configurar depois"],
    ["Meta Ads", client.meta_page_id ? `Página ${client.meta_page_id}` : "Configurar depois"],
    ["Google Calendar", client.calendar_id ?? "Configurar depois"],
    ["Agente de IA", client.agent_active ? "Ativo" : "Inativo"],
    ["Serviços", (client.services ?? []).map((s) => SERVICE_LABEL[s] ?? s).join(", ") || "—"],
  ];
  return (
    <Card className="divide-y divide-line">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-6 px-4 py-2.5">
          <span className="text-xs text-ink-mute">{label}</span>
          <span className="text-right text-sm text-ink">{value}</span>
        </div>
      ))}
    </Card>
  );
}
