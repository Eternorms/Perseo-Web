"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  BrainCircuit,
  Clapperboard,
  Gauge,
  type LucideIcon,
  Megaphone,
  Network,
  Plus,
  Radar,
  ShieldAlert,
  Workflow,
} from "lucide-react";
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
        title: "Estudo de Concorrentes",
        desc: "Os ângulos que seus concorrentes escalam e os que já abandonaram.",
      },
      {
        icon: BrainCircuit,
        title: "Roteiros por IA",
        desc: "Novos ângulos a cada ciclo, sobre o que move o seu público.",
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
        title: "Vídeo nativo",
        desc: "Criativos que parecem conteúdo, não propaganda.",
      },
      {
        icon: Gauge,
        title: "Velocidade de teste",
        desc: "Dezenas de hooks e ângulos testados por semana. Um set de filmagem não chega lá no mês.",
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
        title: "Mídia que entrega a promessa",
        desc: "O que o anúncio promete é o que o cliente encontra.",
      },
      {
        icon: Workflow,
        title: "Do clique ao agendamento",
        desc: "Cada lead conduzido até a venda, sem se perder no caminho.",
      },
    ],
  },
  {
    n: "04",
    short: "TRACKING",
    title: "Tracking anti-fraude",
    outcome: "Número limpo, não inflado. Você decide pelo ROAS real.",
    capabilities: [
      {
        icon: Activity,
        title: "Clareza por criativo",
        desc: "Você enxerga qual criativo gera venda e qual apenas consome verba.",
      },
      {
        icon: ShieldAlert,
        title: "Investimento protegido",
        desc: "O tráfego inválido sai da conta antes de qualquer decisão.",
      },
    ],
  },
  {
    n: "05",
    short: "RELATÓRIO",
    title: "Relatório que decide",
    outcome: "Decisão pronta na segunda. Não métricas de vaidade.",
    capabilities: [
      {
        icon: Network,
        title: "Memória da marca",
        desc: "Cada teste vira aprendizado. A sua marca nunca recomeça do zero.",
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

/** parede lateral curva entre duas etapas: só o colchete ESQUERDO (o lado
 * direito carrega o loop de feedback 05→01). */
function Wall({ color, width }: { color: string; width: number }) {
  const a = (100 - width) / 2; // x do canto (esquerda)
  const bow = 3;
  const st = { filter: `drop-shadow(0 0 3px ${color})`, opacity: 0.5 };
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden className="hidden h-3 w-full md:block">
      <path
        d={`M ${a} 0 Q ${a - bow} 50 ${a} 100`}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        style={st}
      />
    </svg>
  );
}

/** loop de feedback à direita: liga o Relatório (05, base) de volta ao Mercado
 * (01, topo), provando "cada etapa alimenta a próxima". Medido em px (useSize)
 * pra não distorcer; rearma quando uma etapa abre/fecha. */
function FeedbackLoop({ from, to }: { from: string; to: string }) {
  const { ref, w, h } = useSize();
  if (!w || !h) return <div ref={ref} className="pointer-events-none absolute inset-0" />;

  const relX = w * 0.74;
  const relY = h - 14; // direita do Relatório (base)
  const merX = w + 8; // ponta da seta um pouco fora do Mercado (não toca)
  const merY = 22; // entrada no Mercado (topo)
  const off = 88; // afastamento da diagonal (folga p/ o painel aberto não tocar)
  const dBx = relX + off; // base da diagonal
  const dTx = merX + off; // topo da diagonal
  // dobra saindo do Relatório → diagonal paralela ao trapézio (afastada) → dobra no Mercado
  const d = [
    `M ${relX} ${relY}`,
    `L ${dBx} ${relY}`,
    `L ${dTx} ${merY}`,
    `L ${merX} ${merY}`,
  ].join(" ");
  // seta entrando no Mercado (aponta pra esquerda)
  const ah = `M ${merX + 9} ${merY - 6} L ${merX} ${merY} L ${merX + 9} ${merY + 6}`;
  // rótulo ao longo da diagonal
  const ddx = dTx - dBx;
  const ddy = merY - relY;
  const dlen = Math.hypot(ddx, ddy) || 1;
  const dux = ddx / dlen;
  const duy = ddy / dlen;
  const mx = (dBx + dTx) / 2;
  const my = (relY + merY) / 2;
  const lx = mx - duy * 13;
  const ly = my + dux * 13;
  const ang = (Math.atan2(ddy, ddx) * 180) / Math.PI;

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 z-20 hidden md:block">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${w} ${h}`}
        style={{ overflow: "visible", filter: "drop-shadow(0 0 5px rgba(0,255,85,.3))" }}
        aria-hidden
      >
        <defs>
          <linearGradient id="loop-grad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <path d={d} fill="none" stroke="url(#loop-grad)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
        <path d={ah} fill="none" stroke={to} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
        <text
          x={lx}
          y={ly}
          transform={`rotate(${ang} ${lx} ${ly})`}
          textAnchor="middle"
          fontSize="9.5"
          letterSpacing="0.2em"
          fill={to}
          opacity={0.5}
          style={{ fontFamily: "ui-monospace, 'Geist Mono', monospace" }}
        >
          ALIMENTA O MERCADO
        </text>
      </svg>
    </div>
  );
}

/** trapézio centrado de cantos arredondados, em coordenadas px */
function trapPath(w: number, h: number, tf: number, bf: number, r: number, rTop = r) {
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
  const clamp = (v: number) => Math.max(0, Math.min(v, h / 2, (tr - tl) / 2, (br - bl) / 2));
  const rb = clamp(r); // raio dos cantos de baixo
  const rt = clamp(rTop); // raio dos cantos de cima (0 = reto)
  return [
    `M ${tl + rt} 0`,
    `L ${tr - rt} 0`,
    `Q ${tr} 0 ${tr + rux * rt} ${ruy * rt}`,
    `L ${br - rux * rb} ${h - ruy * rb}`,
    `Q ${br} ${h} ${br - rb} ${h}`,
    `L ${bl + rb} ${h}`,
    `Q ${bl} ${h} ${bl + lux * rb} ${h + luy * rb}`,
    `L ${tl - lux * rt} ${-luy * rt}`,
    `Q ${tl} 0 ${tl + rt} 0`,
    "Z",
  ].join(" ");
}

/* carrossel da etapa: conteúdo em cards que trocam (1 por vez, auto-rotate,
 * pausa no hover). 1º card = intro (título + outcome); depois as capacidades. */
function StageCarousel({ stage, accent }: { stage: Stage; accent: string }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides: ReactNode[] = [
    // intro — só título + frase (sem ícone, sem número)
    <div
      key="intro"
      className="flex h-full flex-col justify-center rounded-lg border border-line bg-surface-2 p-3"
    >
      <h4 className="pr-12 text-sm font-semibold text-ink">{stage.title}</h4>
      <p className="mt-1 pr-12 text-[11px] leading-relaxed text-ink-mute">
        → <span className="text-ink">{stage.outcome}</span>
      </p>
    </div>,
    // capacidades
    ...stage.capabilities.map((c) => (
      <div
        key={c.title}
        className="flex h-full items-start gap-3 rounded-lg border border-line bg-surface-2 p-3"
      >
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
    )),
  ];

  const count = slides.length;

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
          {slides.map((_, k) => (
            <button
              key={k}
              type="button"
              onClick={() => setIdx(k)}
              aria-label={`Mostrar card ${k + 1} de ${count}`}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: k === idx ? "18px" : "6px", background: k === idx ? accent : "rgba(255,255,255,0.22)" }}
            />
          ))}
        </div>
      )}
      {/* altura fixa: todos os painéis iguais → o funil não muda de tamanho ao
          trocar a etapa aberta */}
      <div className="h-[84px] overflow-hidden">
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {slides.map((slide, k) => (
            <div key={k} className="h-full w-full shrink-0">
              {slide}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** card escuro interno: trapézio de cantos ARREDONDADOS (clip-path path medido
 * em px → sem distorção), deixando uma linha verde fina e uniforme em volta. */
function DarkCard({
  topFrac,
  botFrac,
  color,
  children,
}: {
  topFrac: number;
  botFrac: number;
  color: string;
  children: ReactNode;
}) {
  const { ref, w, h } = useSize();
  const d = w && h ? trapPath(w, h, topFrac, botFrac, 8, 0) : "";
  const padPct = (((1 - botFrac) / 2) * 100).toFixed(2);
  return (
    <div ref={ref} className="relative">
      {/* preenchimento escuro + linha verde FINA uniforme (stroke segue os cantos) */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${w || 1} ${h || 1}`}
        preserveAspectRatio="none"
        aria-hidden
        style={{ filter: `drop-shadow(0 0 5px ${color}55)`, overflow: "visible" }}
      >
        {d && <path d={d} fill="var(--color-surface-0)" />}
      </svg>
      <div
        className="animate-rise relative"
        style={{
          paddingTop: 13,
          paddingBottom: 13,
          paddingLeft: `calc(${padPct}% + 6px)`,
          paddingRight: `calc(${padPct}% + 6px)`,
        }}
      >
        {children}
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
  isActive,
  onActivate,
}: {
  stage: Stage;
  color: string;
  topFrac: number;
  botFrac: number;
  isActive: boolean;
  onActivate: () => void;
}) {
  const { ref, w, h } = useSize();
  const d = w && h ? trapPath(w, h, topFrac, botFrac, 14) : "";
  const fid = `f-${stage.n}`;

  // card interno: trapézio recuado por um frame verde visível e uniforme; o
  // stroke do DarkCard dá a linha limpa. Raio do card < raio do verde p/ não
  // abrir "cunha" nos cantos.
  // frame verde ~2px uniforme: o card escuro topo recua mais (verde já afina
  // sob o botão) e a base recua menos. Calibrado no olho via render.
  const topInset = 0.029;
  const botInset = 0.004;
  const cTop = Math.max(0.2, topFrac - topInset);
  const cBot = Math.max(0.18, botFrac - botInset);

  // header sempre DENTRO do trapézio (que afina): recua pela largura do trapézio
  // na altura do texto, com folga da borda. expandida: texto no topo (largo);
  // retraída: texto no meio do bar curto (mais estreito).
  const textY = isActive ? 16 : (h || 36) / 2;
  const fracAtText = h ? topFrac - ((textY + 8) / h) * (topFrac - botFrac) : topFrac;
  const headPadPct = Math.max(0, ((1 - fracAtText) / 2) * 100).toFixed(2);

  return (
    <div
      ref={ref}
      className="relative w-full transition-[filter] duration-300"
      style={{
        filter: isActive
          ? `drop-shadow(0 0 22px ${color}8c)`
          : `drop-shadow(0 2px 9px ${color}3d)`,
      }}
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
            <stop offset="44%" stopColor={`${color}f0`} />
            <stop offset="100%" stopColor={`${color}a6`} />
          </linearGradient>
          <linearGradient id={`${fid}-gloss`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.62" />
            <stop offset="16%" stopColor="#ffffff" stopOpacity="0.13" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {d && (
          <>
            <path d={d} fill={`url(#${fid}-fill)`} stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
            <path d={d} fill={`url(#${fid}-gloss)`} />
          </>
        )}
      </svg>

      {/* conteúdo sobre o trapézio */}
      <div className="relative">
        <button
          type="button"
          onMouseEnter={onActivate}
          onFocus={onActivate}
          onClick={onActivate}
          aria-expanded={isActive}
          aria-label={`Etapa ${stage.n}: ${stage.title}`}
          className="flex w-full items-center justify-between"
          style={{
            paddingLeft: `calc(${headPadPct}% + 14px)`,
            paddingRight: `calc(${headPadPct}% + 14px)`,
            paddingTop: isActive ? 16 : 8,
            paddingBottom: 8,
          }}
        >
          <span className="num text-[13px] font-semibold tracking-wide" style={{ color: INK }}>
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
          <div style={{ paddingTop: 7, paddingBottom: 3 }}>
            <DarkCard topFrac={cTop} botFrac={cBot} color={color}>
              <StageCarousel key={stage.n} stage={stage} accent={color} />
            </DarkCard>
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
            Full-funnel de verdade: cada etapa alimenta a próxima.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-mute">
            Um sistema, não cinco fornecedores. Toque em cada etapa e veja o que roda por dentro.
          </p>
        </Reveal>

        {/* funil interativo */}
        <div className="relative mx-auto mt-14 max-w-3xl">
          {/* halo neon atrás do topo do funil */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-8 mx-auto h-48 w-2/3 rounded-full blur-3xl"
            style={{ background: "radial-gradient(closest-side, rgba(0,255,85,0.12), transparent)" }}
          />
          <div className="relative flex flex-col gap-2 md:gap-0">
            {STAGES.map((s, i) => (
              <Fragment key={s.n}>
                <FunnelBar
                  stage={s}
                  color={COLORS[i]}
                  topFrac={desktop ? TOPW[i] / 100 : 1}
                  botFrac={desktop ? BOTW[i] / 100 : 1}
                  isActive={active === i}
                  onActivate={() => setActive(i)}
                />
                {i < STAGES.length - 1 && <Wall color={COLORS[i]} width={BOTW[i]} />}
              </Fragment>
            ))}
            <FeedbackLoop from={COLORS[COLORS.length - 1]} to={COLORS[0]} />
          </div>
        </div>
      </div>
    </section>
  );
}
