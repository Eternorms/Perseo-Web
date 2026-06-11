import type { Metadata } from "next";
import { requireClient } from "@/lib/auth";
import { SERVICE_LABEL } from "@/lib/labels";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/kit/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/client/settings-form";

export const metadata: Metadata = { title: "Configurações" };

export default async function ClientSettingsPage() {
  const { client } = await requireClient();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Configurações" subtitle="Dados da sua marca e comportamento do agente de IA." />

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <SettingsForm client={client} />

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Seu plano com a Perseo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-line text-sm">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-ink-mute">Plano</span>
              <span className="capitalize text-ink">{client.plan?.replace("_", "-") ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-ink-mute">Serviços</span>
              <span className="text-ink">{(client.services ?? []).map((s) => SERVICE_LABEL[s] ?? s).join(" + ") || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-ink-mute">Cliente desde</span>
              <span className="num text-ink">{fmtDate(client.created_at)}</span>
            </div>
            <p className="pt-3 text-[11px] leading-relaxed text-ink-faint">
              Mudanças de plano, integrações (WhatsApp, Meta, Calendar) e cobrança são feitas com seu
              estrategista — chame em Mensagens.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
