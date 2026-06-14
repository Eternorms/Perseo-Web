"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  BrainCircuit,
  Clapperboard,
  FileBarChart,
  type LucideIcon,
  Layers,
  Megaphone,
  Network,
  Radar,
  ShieldAlert,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

/**
 * Funil integrado — funde Metodologia + Capacidades + Auditoria de fraude
 * num seletor de funil interativo. Clica numa etapa e o painel troca com
 * as capacidades + o resultado dela. A etapa 04 carrega a fórmula de ROAS
 * ajustado por fraude. Server-render mostra a etapa 01 (fallback estático).
 */

interface Capability {
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface Stage {
  n: string;
  short: string;
  title: string;
  outcome: string;
  capabilities: Capability[];
  fraud?: boolean;
}

const STAGES: Stage[] = [
  {
    n: "01",
    short: "MERCADO",
    title: "Inteligência de mercado",
    outcome: "Você começa sabendo o que já funciona no seu nicho.",
    capabilities: [
      {
        icon: Radar,
        title: "Espionagem de concorrentes",
        desc: "Coleta contínua da Meta Ad Library — quais ângulos seus concorrentes escalam e quais abandonam.",
      },
      {
        icon: BrainCircuit,
        title: "Roteiros por IA",
        desc: "Dezenas de variações de ângulo e hook por ciclo, sobre a dor real da audiência.",
      },
    ],
  },
  {
    n: "02",
    short: "CRIATIVOS",
    title: "Criativos UGC em escala",
    outcome: "Volume de teste que vira aprendizado. Toda semana, não todo mês.",
    capabilities: [
      {
        icon: Clapperboard,
        title: "Vídeo 9:16 nativo",
        desc: "UGC com avatares de IA, hooks testáveis em lote.",
      },
      {
        icon: Layers,
        title: "Produção em lote",
        desc: "Roteiros de direct response e edição AI-first. Volume de teste semanal, não mensal.",
      },
    ],
  },
  {
    n: "03",
    short: "MÍDIA",
    title: "Distribuição & landing",
    outcome: "Do anúncio à venda, sem atrito.",
    capabilities: [
      {
        icon: Megaphone,
        title: "Mídia orgânica & paga",
        desc: "Publicação que sustenta a promessa do criativo, do anúncio à landing.",
      },
      {
        icon: Workflow,
        title: "Funil integrado",
        desc: "Lead do anúncio ao agendamento, com follow-up automático e página sem atrito.",
      },
    ],
  },
  {
    n: "04",
    short: "TRACKING",
    title: "Tracking anti-fraude",
    outcome: "Número limpo, não inflado. Decisão sobre ROAS real.",
    fraud: true,
    capabilities: [
      {
        icon: Activity,
        title: "Tracking por criativo",
        desc: "Hook rate, CPA e ROAS de cada vídeo — o vencedor é matemático, não opinião.",
      },
      {
        icon: ShieldAlert,
        title: "Auditoria de fraude",
        desc: "fraud_rate e cliques inválidos medidos por campanha. O ROAS que você vê já é o ajustado.",
      },
    ],
  },
  {
    n: "05",
    short: "RELATÓRIO",
    title: "Relatório que decide",
    outcome: "Decisão pra segunda-feira. Não um relatório de vaidade.",
    capabilities: [
      {
        icon: FileBarChart,
        title: "Relatório automático",
        desc: "Mensal, por escrito, com decisão — não um PDF de vaidade.",
      },
      {
        icon: Network,
        title: "Knowledge Graph",
        desc: "Cada teste vira memória: dor → ângulo → hook → resultado. Sua marca não recomeça do zero.",
      },
    ],
  },
];

export function FunnelSystem() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active];

  return (
    <section id="funil" className="scroll-mt-20 border-b border-line bg-surface-1">
      <div className="mx-auto w-full max-w-6xl px-5 py-20">
        <Reveal>
          <p className="microlabel">Funil integrado</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
            Full-funnel de verdade: cada fase alimenta a próxima.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-mute">
            Um sistema, não cinco fornecedores. Clique em cada etapa para ver o que roda por dentro.
          </p>
        </Reveal>

        {/* seletor: pipeline de 5 etapas */}
        <div className="relative mt-12">
          {/* trilha base + progresso neon até a etapa ativa */}
          <div className="absolute left-[10%] right-[10%] top-4 h-px bg-line-strong" aria-hidden />
          <div
            className="absolute left-[10%] top-4 h-px bg-neon transition-[width] duration-500 ease-out"
            style={{ width: `calc(${active * 20}% )`, boxShadow: "0 0 8px rgba(0,255,65,0.5)" }}
            aria-hidden
          />
          <div className="relative grid grid-cols-5">
            {STAGES.map((s, i) => (
              <button
                key={s.n}
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={active === i}
                aria-label={`Etapa ${s.n}: ${s.title}`}
                className="group flex flex-col items-center gap-2"
              >
                <span
                  className={cn(
                    "num flex size-8 items-center justify-center rounded-full border bg-surface-1 text-xs transition-all duration-200",
                    active === i
                      ? "border-neon text-neon shadow-[0_0_16px_rgba(0,255,65,0.3)]"
                      : i < active
                        ? "border-neon/40 text-neon/70"
                        : "border-line-strong text-ink-mute group-hover:border-ink-faint group-hover:text-ink",
                  )}
                >
                  {s.n}
                </span>
                <span
                  className={cn(
                    "microlabel text-center transition-colors",
                    active === i ? "text-neon" : "text-ink-faint group-hover:text-ink-mute",
                  )}
                >
                  {s.short}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* painel da etapa ativa */}
        <div key={active} className="mt-12 animate-rise">
          <div className="flex items-baseline gap-3">
            <span className="num text-2xl text-neon">{stage.n}</span>
            <h3 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">{stage.title}</h3>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-mute">
            → <span className="text-ink">{stage.outcome}</span>
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {stage.capabilities.map((c) => (
              <article key={c.title} className="rounded-lg border border-line bg-surface-2 p-5">
                <c.icon className="size-5 text-neon" aria-hidden />
                <h4 className="mt-3 text-sm font-semibold text-ink">{c.title}</h4>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-mute">{c.desc}</p>
              </article>
            ))}

            {stage.fraud && (
              <div className="rounded-xl border border-line-strong bg-surface-2 p-6 md:col-span-2">
                <div className="grid gap-6 md:grid-cols-2 md:items-center">
                  <div>
                    <p className="microlabel mb-2 text-loss">Quanto do seu ROAS é mentira?</p>
                    <p className="max-w-md text-sm leading-relaxed text-ink-mute">
                      Cliques de bot e tráfego inválido inflam métricas e queimam orçamento em silêncio.
                      Todo ROAS que você vê na Perseo já está ajustado pela taxa de fraude medida.
                    </p>
                    <Link href="#contato" className="mt-5 inline-block">
                      <Button variant="outline" size="sm">
                        Auditar minha conta →
                      </Button>
                    </Link>
                  </div>
                  <div className="rounded-lg border border-line bg-surface-1 p-5">
                    <p className="microlabel mb-3">fórmula de decisão</p>
                    <p className="num text-base leading-relaxed text-ink md:text-lg">
                      ROAS<sub className="text-ink-faint">real</sub> = ROAS<sub className="text-ink-faint">reportado</sub>
                    </p>
                    <p className="num mt-1 text-base leading-relaxed text-neon md:text-lg">× (1 − fraud_rate)</p>
                    <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line">
                      <div className="bg-surface-2 p-4">
                        <p className="microlabel">reportado</p>
                        <p className="num mt-1 text-2xl text-ink">3.40×</p>
                      </div>
                      <div className="bg-surface-2 p-4">
                        <p className="microlabel">com 12% de fraude</p>
                        <p className="num mt-1 text-2xl text-loss">2.99×</p>
                      </div>
                    </div>
                    <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
                      Exemplo ilustrativo. A diferença entre escalar um vencedor de verdade e escalar um erro caro.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
