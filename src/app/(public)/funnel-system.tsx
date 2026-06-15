"use client";

import { useEffect, useRef, useState } from "react";
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
 * num funil visual interativo. Cada etapa é um TRAPÉZIO de cantos levemente
 * arredondados (SVG medido em px, sem distorção), empilhados num triângulo
 * invertido contínuo (gradiente verde → ciano). Passar o mouse / focar /
 * clicar abre a etapa com as capacidades (carrossel) + o resultado. A etapa
 * 04 carrega a fórmula de ROAS ajustado por fraude.
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
/* larguras (% do container): topo de cada etapa → base. Taper suave e largo,
 * contínuo (base[i] = topo[i+1]) pra fechar o triângulo invertido. */
const TOPW = [100, 88, 76, 65, 55];
const BOTW = [88, 76, 65, 55, 46];
const INK = "#04130a";

/** mede o tamanho real (px) do elemento — pra desenhar o SVG sem distorção */
function useSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, ...size };
}

function useDesktop() {
  const [d, setD] = useState(true);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 768px)");
    const update = () => setD(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);
  return d;
}

/** trapézio centrado de cantos arredondados, em coordenadas px */
function trapPath(w: number, h: number, tf: number, bf: number, r: number) {
  const tl = (w * (1 - tf)) / 2;
  const tr = (w * (1 + tf)) / 2;
  const bl = (w * (1 - bf)) / 2;
  const br = (w * (1 + bf)) / 2;
  const rl = Math.hypot(br - tr, h);
  const rux = (br - tr) / rl;
  const ruy = h / rl; // unidade descendo o lado direito
  const ll = Math.hypot(tl - bl, h);
  const lux = (tl - bl) / ll;
  const luy = -h / ll; // unidade subindo o lado esquerdo
  const rr = Math.max(0, Math.min(r, h / 2, (tr - tl) / 2, (br - bl) / 2));
  return [
    `M ${tl + rr} 0`,
    `L ${tr - rr} 0`,
    `Q ${tr} 0 ${tr + rux * rr} ${ruy * rr}`,
    `L ${br - rux * rr} ${h - ruy * rr}`,
    `Q ${br} ${h} ${br - rr} ${h}`,
    `L ${bl + rr} ${h}`,
    `Q ${bl} ${h} ${bl + lux * rr} ${h + luy * rr}`,
    `L ${tl - lux * rr} ${-luy * rr}`,
    `Q ${tl} 0 ${tl + rr} 0`,
    "Z",
  ].join(" ");
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
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {count > 1 && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
          {items.map((c, k) => (
            <button
              key={c.title}
              type="button"
              onClick={() => setIdx(k)}
              aria-label={`Mostrar card ${k + 1} de ${count}`}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: k === idx ? "18px" : "6px", background: k === idx ? accent : "rgba(255,255,255,0.22)" }}
            />
          ))}
        </div>
      )}
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
                <div className="pr-12">
                  <h4 className="text-[13px] font-semibold text-ink">{c.title}</h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-mute">{c.desc}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

/** uma etapa do funil: trapézio SVG (cantos arredondados) + conteúdo */
function FunnelBar({
  stage,
  color,
  topFrac,
  botFrac,
  contentPct,
  isActive,
  onActivate,
}: {
  stage: Stage;
  color: string;
  topFrac: number;
  botFrac: number;
  contentPct: number;
  isActive: boolean;
  onActivate: () => void;
}) {
  const { ref, w, h } = useSize();
  const d = w && h ? trapPath(w, h, topFrac, botFrac, 10) : "";
  const fid = `f-${stage.n}`;

  return (
    <div
      ref={ref}
      className="relative w-full transition-[filter] duration-300"
      style={{ filter: isActive ? `drop-shadow(0 0 18px ${color}80)` : `drop-shadow(0 2px 8px ${color}38)` }}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${w || 1} ${h || 1}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={`${fid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="62%" stopColor={`${color}e6`} />
            <stop offset="100%" stopColor={`${color}cc`} />
          </linearGradient>
          <linearGradient id={`${fid}-gloss`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="22%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        {d && (
          <>
            <path d={d} fill={`url(#${fid}-fill)`} stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
            <path d={d} fill={`url(#${fid}-gloss)`} />
          </>
        )}
      </svg>

      {/* conteúdo centrado na largura da base do trapézio (nunca vaza) */}
      <div className="relative mx-auto" style={{ width: `${contentPct}%` }}>
        <button
          type="button"
          onMouseEnter={onActivate}
          onFocus={onActivate}
          onClick={onActivate}
          aria-expanded={isActive}
          aria-label={`Etapa ${stage.n}: ${stage.title}`}
          className="flex w-full items-center justify-center gap-2.5 px-4 py-3"
        >
          <span className="num text-[13px] font-semibold tracking-wide" style={{ color: INK }}>
            <span style={{ opacity: 0.5 }}>{stage.n}</span>
            <span className="mx-2" style={{ opacity: 0.28 }}>
              |
            </span>
            {stage.short}
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

        {isActive && (
          <div className="pb-2">
            <div className="animate-rise rounded-[14px] bg-surface-0/95 p-4 backdrop-blur-sm">
              <div className="flex items-baseline gap-2.5">
                <span className="num text-base text-neon">{stage.n}</span>
                <h3 className="text-[15px] font-semibold tracking-tight text-ink">{stage.title}</h3>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-mute">
                → <span className="text-ink">{stage.outcome}</span>
              </p>

              <div className="mt-3.5">
                <CapabilityCarousel key={stage.n} items={stage.capabilities} accent={color} />
              </div>

              {stage.fraud && (
                <div className="mt-2.5 rounded-lg border border-line-strong bg-surface-2 p-3.5">
                  <div className="grid gap-4 md:grid-cols-2 md:items-center">
                    <div>
                      <p className="microlabel mb-1.5 text-loss">Quanto do seu ROAS é mentira?</p>
                      <p className="text-[11px] leading-relaxed text-ink-mute">
                        Cliques de bot e tráfego inválido inflam métricas e queimam orçamento em silêncio. Todo ROAS que
                        você vê na Perseo já está ajustado pela taxa de fraude medida.
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
      </div>
    </div>
  );
}

export function FunnelSystem() {
  const [active, setActive] = useState(0);
  const desktop = useDesktop();

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
        <div className="relative mx-auto mt-14 max-w-3xl">
          {/* halo neon atrás do topo do funil */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-8 mx-auto h-48 w-2/3 rounded-full blur-3xl"
            style={{ background: "radial-gradient(closest-side, rgba(0,255,85,0.18), transparent)" }}
          />
          <div className="relative flex flex-col gap-2 md:gap-0">
            {STAGES.map((s, i) => (
              <FunnelBar
                key={s.n}
                stage={s}
                color={COLORS[i]}
                topFrac={desktop ? TOPW[i] / 100 : 1}
                botFrac={desktop ? BOTW[i] / 100 : 1}
                contentPct={desktop ? BOTW[i] : 100}
                isActive={active === i}
                onActivate={() => setActive(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
