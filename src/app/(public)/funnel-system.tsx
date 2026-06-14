"use client";

import { Fragment, useEffect, useState, type CSSProperties } from "react";
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
  Plus,
  Radar,
  ShieldAlert,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

/**
 * Funil integrado — funde Metodologia + Capacidades + Auditoria de fraude
 * num funil visual interativo. Cada etapa é uma barra em TRAPÉZIO; quando
 * uma etapa abre, o painel de conteúdo também é um TRAPÉZIO que dá
 * continuidade ao afunilamento (as barras abaixo estreitam pra fechar o
 * triângulo sem degrau). Passar o mouse / focar / clicar abre a etapa. A
 * etapa 04 carrega a fórmula de ROAS ajustado por fraude.
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

/* gradiente do funil: verde neon (topo) → ciano (fundo) */
const COLORS = ["#00FF55", "#00EFA0", "#00DED6", "#23CCEE", "#54B2FF"];
const INK = "#04130a";

/* afunilamento: cada barra perde STEP%; o painel aberto perde PANEL_DROP%.
 * Como total = 5×STEP + PANEL_DROP é constante, a silhueta do triângulo é
 * sempre a mesma (100% → 37%); só a "barriga" do painel desliza p/ a etapa
 * ativa, e as barras abaixo estreitam pra fechar o triângulo. */
const STEP = 9;
const PANEL_DROP = 18;

/* clip-path de trapézio centrado: topo `top%`, base `bot%` */
function clipFor(top: number, bot: number) {
  const lt = (100 - top) / 2;
  const lb = (100 - bot) / 2;
  return `polygon(${lt}% 0, ${100 - lt}% 0, ${100 - lb}% 100%, ${lb}% 100%)`;
}

/* carrossel horizontal: mostra 1 card por vez e troca sozinho (pausa no hover).
 * Permite mais conteúdo por etapa sem aumentar a altura do painel. */
function CapabilityCarousel({ items, accent }: { items: Capability[]; accent: string }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  useEffect(() => {
    if (paused || count <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 3600);
    return () => clearInterval(t);
  }, [paused, count]);

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {items.map((c) => (
            <article key={c.title} className="w-full shrink-0">
              <div className="flex h-full items-start gap-3 rounded-lg border border-line bg-surface-2 p-4">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-md"
                  style={{ background: `${accent}1f`, border: `1px solid ${accent}3a` }}
                >
                  <c.icon className="size-4" style={{ color: accent }} aria-hidden />
                </span>
                <div>
                  <h4 className="text-[13px] font-semibold text-ink">{c.title}</h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-mute">{c.desc}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      {count > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {items.map((c, k) => (
            <button
              key={c.title}
              type="button"
              onClick={() => setIdx(k)}
              aria-label={`Mostrar card ${k + 1} de ${count}`}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: k === idx ? "20px" : "6px", background: k === idx ? accent : "rgba(255,255,255,0.18)" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FunnelSystem() {
  const [active, setActive] = useState(0);

  // larguras dependem da etapa ativa (o painel "consome" parte do afunilamento)
  const barTop: number[] = [];
  const barBot: number[] = [];
  let panelTop = 0;
  let panelBot = 0;
  {
    let w = 100;
    for (let i = 0; i < STAGES.length; i++) {
      barTop[i] = +w.toFixed(1);
      w = +(w - STEP).toFixed(1);
      barBot[i] = w;
      if (i === active) {
        panelTop = w;
        w = +(w - PANEL_DROP).toFixed(1);
        panelBot = w;
      }
    }
  }

  return (
    <section id="funil" className="scroll-mt-20 border-b border-line bg-surface-1">
      <div className="mx-auto w-full max-w-6xl px-5 py-20">
        <Reveal>
          <p className="microlabel">Funil integrado</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
            Full-funnel de verdade: cada fase alimenta a próxima.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-mute">
            Um sistema, não cinco fornecedores. Passe por cada etapa para ver o que roda por dentro.
          </p>
        </Reveal>

        {/* funil interativo */}
        <div className="relative mx-auto mt-14 max-w-2xl">
          {/* halo neon atrás do topo do funil */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-8 mx-auto h-48 w-2/3 rounded-full blur-3xl"
            style={{ background: "radial-gradient(closest-side, rgba(0,255,85,0.18), transparent)" }}
          />
          <div className="relative flex flex-col items-center gap-2 md:gap-0">
            {STAGES.map((s, i) => {
              const isActive = active === i;
              const color = COLORS[i];
              return (
                <Fragment key={s.n}>
                  {/* wrapper do glow (drop-shadow segue o trapézio) */}
                  <div
                    className="w-full transition-[filter] duration-300"
                    style={{
                      filter: isActive
                        ? `drop-shadow(0 0 18px ${color}88)`
                        : `drop-shadow(0 2px 7px ${color}3a)`,
                    }}
                  >
                    {/* barra-trapézio */}
                    <div
                      className="relative w-full overflow-hidden rounded-2xl transition-[clip-path] duration-200 hover:brightness-[1.04] md:rounded-none md:[clip-path:var(--clip)]"
                      style={{
                        "--clip": clipFor(barTop[i], barBot[i]),
                        background: `linear-gradient(180deg, ${color} 0%, ${color}f2 58%, ${color}d6 100%)`,
                      } as CSSProperties}
                    >
                      {/* brilho de topo (gloss) */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 24%, rgba(255,255,255,0) 56%, rgba(0,0,0,0.1) 100%)",
                        }}
                      />
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onFocus={() => setActive(i)}
                        onClick={() => setActive(i)}
                        aria-expanded={isActive}
                        aria-label={`Etapa ${s.n}: ${s.title}`}
                        className="relative flex w-full items-center justify-center gap-2.5 px-4 py-3"
                      >
                        <span className="num text-[13px] font-semibold tracking-wide" style={{ color: INK }}>
                          <span style={{ opacity: 0.5 }}>{s.n}</span>
                          <span className="mx-2" style={{ opacity: 0.28 }}>
                            |
                          </span>
                          {s.short}
                        </span>
                        <span
                          className="flex size-5 shrink-0 items-center justify-center rounded-full"
                          style={{ background: "rgba(0,0,0,0.16)" }}
                        >
                          <Plus
                            className={cn("size-3 transition-transform duration-300", isActive && "rotate-45")}
                            style={{ color: INK }}
                          />
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* painel-trapézio da etapa ativa — continua o afunilamento */}
                  {isActive && (
                    <div
                      className="relative w-full overflow-hidden rounded-2xl bg-surface-0/95 backdrop-blur-sm transition-[clip-path] duration-200 md:rounded-none md:[clip-path:var(--clip)]"
                      style={{
                        "--clip": clipFor(panelTop, panelBot),
                        filter: "drop-shadow(0 12px 22px rgba(0,0,0,0.5))",
                      } as CSSProperties}
                    >
                      {/* borda neon de topo, acompanhando a etapa */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background: `linear-gradient(180deg, ${color}38 0%, transparent 14%)`,
                        }}
                      />
                      {/* conteúdo centrado na largura da BASE do trapézio (nunca corta) */}
                      <div
                        className="animate-rise @container mx-auto p-4"
                        style={{ width: `${panelBot}%` } as CSSProperties}
                      >
                        <div className="flex items-baseline gap-2.5">
                          <span className="num text-base text-neon">{s.n}</span>
                          <h3 className="text-[15px] font-semibold tracking-tight text-ink">{s.title}</h3>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-ink-mute">
                          → <span className="text-ink">{s.outcome}</span>
                        </p>

                        <div className="mt-3.5">
                          <CapabilityCarousel key={s.n} items={s.capabilities} accent={color} />
                        </div>

                        {s.fraud && (
                          <div className="mt-2.5 rounded-lg border border-line-strong bg-surface-2 p-3.5">
                            <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @lg:items-center">
                              <div>
                                <p className="microlabel mb-1.5 text-loss">Quanto do seu ROAS é mentira?</p>
                                <p className="text-[11px] leading-relaxed text-ink-mute">
                                  Cliques de bot e tráfego inválido inflam métricas e queimam orçamento em silêncio.
                                  Todo ROAS que você vê na Perseo já está ajustado pela taxa de fraude medida.
                                </p>
                                <Link href="#contato" className="mt-3 inline-block">
                                  <Button variant="outline" size="sm">
                                    Auditar minha conta →
                                  </Button>
                                </Link>
                              </div>
                              <div className="rounded-md border border-line bg-surface-1 p-4">
                                <p className="microlabel mb-2">fórmula de decisão</p>
                                <p className="num text-sm leading-relaxed text-ink">
                                  ROAS<sub className="text-ink-faint">real</sub> = ROAS
                                  <sub className="text-ink-faint">reportado</sub>
                                </p>
                                <p className="num mt-1 text-sm leading-relaxed text-neon">× (1 − fraud_rate)</p>
                                <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line">
                                  <div className="bg-surface-2 p-3">
                                    <p className="microlabel">reportado</p>
                                    <p className="num mt-0.5 text-xl text-ink">3.40×</p>
                                  </div>
                                  <div className="bg-surface-2 p-3">
                                    <p className="microlabel">com 12% fraude</p>
                                    <p className="num mt-0.5 text-xl text-loss">2.99×</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
