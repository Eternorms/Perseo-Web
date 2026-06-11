"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { captureLeadAction, type LeadCaptureState } from "@/lib/actions/public";
import { REVENUE_BANDS } from "@/lib/validation/public";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

const INITIAL: LeadCaptureState = { ok: false, error: null };

export function LeadForm() {
  const [state, formAction, pending] = useActionState(captureLeadAction, INITIAL);

  if (state.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-neon/30 bg-neon/5 px-6 py-12 text-center animate-rise">
        <CheckCircle2 className="size-8 text-neon" aria-hidden />
        <p className="text-base font-semibold text-ink">Recebido. Análise em produção.</p>
        <p className="max-w-sm text-sm leading-relaxed text-ink-mute">
          Respondemos em até 1 dia útil com os primeiros achados sobre seus concorrentes e o plano de ataque.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {/* honeypot */}
      <div className="hidden" aria-hidden>
        <label>
          Site
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lead-brand">Marca</Label>
        <Input id="lead-brand" name="brand" required placeholder="Nome da sua marca" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lead-name">Seu nome</Label>
        <Input id="lead-name" name="name" required placeholder="Quem decide o growth" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lead-email">E-mail</Label>
        <Input id="lead-email" name="email" type="email" required placeholder="voce@marca.com" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lead-whatsapp">WhatsApp</Label>
        <Input id="lead-whatsapp" name="whatsapp" type="tel" required placeholder="+55 11 9…" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lead-revenue">Faturamento mensal</Label>
        <NativeSelect id="lead-revenue" name="revenue" required defaultValue="">
          <option value="" disabled>
            Selecione a faixa
          </option>
          {REVENUE_BANDS.map((b) => (
            <option key={b} value={b}>
              {b === "<50k" ? "Até $50k/mês" : b === ">500k" ? "Acima de $500k/mês" : `$${b}/mês`}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lead-instagram">Instagram da marca (opcional)</Label>
        <Input id="lead-instagram" name="instagram" placeholder="@suamarca" />
      </div>

      {state.error ? (
        <p role="alert" className="rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss sm:col-span-2">
          {state.error}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <Button variant="primary" size="lg" type="submit" disabled={pending} className="w-full">
          {pending ? "Enviando…" : "Pedir análise gratuita →"}
        </Button>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-faint">
          Sem spam, sem call de 1 hora. Primeiros achados por escrito, direto ao ponto.
        </p>
      </div>
    </form>
  );
}
