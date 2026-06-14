import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  BrainCircuit,
  Clapperboard,
  FileBarChart,
  Network,
  Radar,
  ShieldAlert,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/components/charts/sparkline";
import { LeadForm } from "./lead-form";
import { Reveal } from "./reveal";
import { FunnelFlow } from "./funnel-flow";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Perseo — Growth full-funnel alavancado por IA para D2C",
  description:
    "Inteligência de concorrentes, criativos UGC em escala, landing e relatório — com ROAS auditado contra fraude. Um parceiro sênior, não cinco fornecedores.",
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <PainStrip />
      <Methodology />
      <Capabilities />
      <FraudSection />
      <Offers />
      <FinalCta />
    </>
  );
}

/* ── Hero ─────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line pt-14">
      <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
      <div
        aria-hidden
        className="hero-glow pointer-events-none absolute left-1/2 top-0 h-[480px] w-[820px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(0,255,65,0.25), transparent)" }}
      />
      <div className="mem-graph pointer-events-none absolute inset-0" aria-hidden>
        <svg viewBox="0 0 1200 600" fill="none" preserveAspectRatio="xMidYMid slice" className="h-full w-full" style={{ overflow: "visible" }}>
          <circle className="mem-node" style={{ animationDelay: "0s" }} cx="70" cy="80" r="2.5" />
          <circle className="mem-node" style={{ animationDelay: "2.3s" }} cx="150" cy="185" r="2" />
          <circle className="mem-node" style={{ animationDelay: "1.4s" }} cx="60" cy="360" r="2.5" />
          <circle className="mem-node" style={{ animationDelay: "3.1s" }} cx="95" cy="540" r="2" />
          <circle className="mem-node" style={{ animationDelay: "0.7s" }} cx="245" cy="505" r="2" />
          <circle className="mem-node" style={{ animationDelay: "4s" }} cx="300" cy="580" r="2" />
          <circle className="mem-node" style={{ animationDelay: "1.9s" }} cx="420" cy="90" r="2" />
          <circle className="mem-node" style={{ animationDelay: "2.1s" }} cx="560" cy="70" r="2" />
          <circle className="mem-node" style={{ animationDelay: "3.6s" }} cx="640" cy="140" r="2" />
          <circle className="mem-node" style={{ animationDelay: "0.5s" }} cx="780" cy="75" r="2" />
          <circle className="mem-node" style={{ animationDelay: "2.7s" }} cx="900" cy="95" r="2" />
          <circle className="mem-node" style={{ animationDelay: "0.4s" }} cx="1000" cy="90" r="2" />
          <circle className="mem-node" style={{ animationDelay: "4.4s" }} cx="1090" cy="185" r="2" />
          <circle className="mem-node" style={{ animationDelay: "1.1s" }} cx="1175" cy="95" r="2.5" />
          <circle className="mem-node" style={{ animationDelay: "2.8s" }} cx="1180" cy="370" r="2" />
          <circle className="mem-node" style={{ animationDelay: "3.3s" }} cx="1140" cy="500" r="2" />
          <circle className="mem-node" style={{ animationDelay: "1.8s" }} cx="1050" cy="560" r="2" />
          <circle className="mem-node" style={{ animationDelay: "0.9s" }} cx="1130" cy="585" r="2" />
          <line className="mem-path-flow" pathLength="1" style={{ animationDelay: "0.9s" }} x1="170" y1="460" x2="135" y2="290" />
          <line className="mem-path-flow" pathLength="1" style={{ animationDelay: "3s" }} x1="135" y1="290" x2="255" y2="150" />
          <line className="mem-path-flow" pathLength="1" style={{ animationDelay: "5.1s" }} x1="255" y1="150" x2="945" y2="150" />
          <line className="mem-path-flow" pathLength="1" style={{ animationDelay: "7.2s" }} x1="945" y1="150" x2="1080" y2="290" />
          <line className="mem-path-flow" pathLength="1" style={{ animationDelay: "9.3s" }} x1="1080" y1="290" x2="1050" y2="420" />
          <line className="mem-path-flow" pathLength="1" style={{ animationDelay: "11.4s" }} x1="1050" y1="420" x2="1000" y2="470" />
          <line className="mem-path-flow" pathLength="1" style={{ animationDelay: "13.8s" }} x1="1000" y1="470" x2="170" y2="460" />
          <g>
            <circle className="mem-step-dot" style={{ animationDelay: "0.3s" }} cx="170" cy="460" r="2" />
            <text className="mem-step-label" style={{ animationDelay: "0.3s" }} x="154" y="464" textAnchor="end">PESQUISA</text>
          </g>
          <g>
            <circle className="mem-step-dot" style={{ animationDelay: "2.4s" }} cx="135" cy="290" r="2" />
            <text className="mem-step-label" style={{ animationDelay: "2.4s" }} x="119" y="294" textAnchor="end">ESTRATÉGIA</text>
          </g>
          <g>
            <circle className="mem-step-dot" style={{ animationDelay: "4.5s" }} cx="255" cy="150" r="2" />
            <text className="mem-step-label" style={{ animationDelay: "4.5s" }} x="255" y="133" textAnchor="middle">CRIATIVOS</text>
          </g>
          <g>
            <circle className="mem-step-dot" style={{ animationDelay: "6.6s" }} cx="945" cy="150" r="2" />
            <text className="mem-step-label" style={{ animationDelay: "6.6s" }} x="945" y="133" textAnchor="middle">ANÚNCIOS</text>
          </g>
          <g>
            <circle className="mem-step-dot" style={{ animationDelay: "8.7s" }} cx="1080" cy="290" r="2" />
            <text className="mem-step-label" style={{ animationDelay: "8.7s" }} x="1064" y="294" textAnchor="end">LANDING PAGES</text>
          </g>
          <g>
            <circle className="mem-step-dot-gold" style={{ animationDelay: "10.8s" }} cx="1050" cy="420" r="2" />
            <text className="mem-step-label-gold" style={{ animationDelay: "10.8s" }} x="1066" y="424" textAnchor="start">ROAS</text>
          </g>
          <g>
            <circle className="mem-step-dot" style={{ animationDelay: "12.9s" }} cx="1000" cy="470" r="2" />
            <text className="mem-step-label" style={{ animationDelay: "12.9s" }} x="1016" y="474" textAnchor="start">RELATÓRIO</text>
          </g>
        </svg>
      </div>
      <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-20 text-center md:pt-28">
        <p className="microlabel animate-rise" style={{ color: "var(--color-ink-mute)", fontSize: "0.8rem" }}>Agência de growth full-funnel · D2C & e-commerce</p>
        <h1 className="mx-auto mt-5 max-w-3xl animate-rise text-4xl font-semibold leading-[1.08] tracking-tight [animation-delay:90ms] md:text-6xl">
          Da pesquisa ao ROAS.
          <br />
          <span className="text-neon glow-neon">Uma máquina de decisão.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl animate-rise text-base leading-relaxed text-ink-mute [animation-delay:180ms] md:text-lg">
          Inteligência de mercado, criativo, mídia, landing e relatório conectados em ciclos semanais.
          Cada teste vira memória — para sua marca não começar do zero a cada nova campanha.
        </p>
        <div className="mt-9 flex animate-rise items-center justify-center gap-3 [animation-delay:270ms]">
          <Link href="#contato">
            <Button variant="primary" size="lg">
              Pedir análise gratuita →
            </Button>
          </Link>
          <Link href="#metodologia">
            <Button variant="ghost" size="lg">
              Ver metodologia
            </Button>
          </Link>
        </div>

        <CommandCenterPreview />
      </div>
    </section>
  );
}

/** Ilustração do produto — valores demonstrativos, não dados de cliente. */
function CommandCenterPreview() {
  const kpis = [
    { label: "ROAS AJUSTADO", value: "3.18×", delta: "▲ 12,4%", good: true },
    { label: "CPA", value: "R$ 41,20", delta: "▼ 38,0%", good: true },
    { label: "HOOK RATE", value: "31,6%", delta: "▲ 4,1%", good: true },
    { label: "FRAUDE", value: "6,2%", delta: "▼ 2,3%", good: true },
  ];
  return (
    <figure aria-hidden className="mx-auto mt-16 max-w-4xl animate-rise text-left [animation-delay:360ms]">
      <div className="overflow-hidden rounded-xl border border-line-strong bg-surface-1 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="microlabel">perseo · command center</span>
          <span className="flex items-center gap-1.5 text-[11px] text-neon">
            <span className="size-1.5 rounded-full bg-neon animate-live" />
            live
          </span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-line border-b border-line md:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="px-4 py-3.5">
              <div className="microlabel">{k.label}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="num text-lg text-ink">{k.value}</span>
                <span className={cn("num text-[11px]", k.good ? "text-neon" : "text-loss")}>{k.delta}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden divide-y divide-line md:block">
          {[
            { name: "UGC-014 · dor → rotina", status: "VENCEDOR", roas: "4.02×", pts: [2, 3, 2.8, 3.4, 3.9, 4.0] },
            { name: "UGC-019 · prova social", status: "TESTE", roas: "2.31×", pts: [1.5, 1.8, 2.4, 2.1, 2.2, 2.3] },
            { name: "UGC-021 · unboxing POV", status: "TESTE", roas: "1.87×", pts: [1, 1.6, 1.4, 1.9, 1.8, 1.9] },
          ].map((row, i) => (
            <div
              key={row.name}
              className="flex animate-rise items-center justify-between gap-4 px-4 py-2.5"
              style={{ animationDelay: `${480 + i * 140}ms` }}
            >
              <span className="num truncate text-xs text-ink-mute">{row.name}</span>
              <span className="flex items-center gap-5">
                <Sparkline
                  points={row.pts}
                  width={88}
                  height={22}
                  color={row.status === "VENCEDOR" ? "#00FF41" : "#5BA3FF"}
                  draw
                  drawDelay={i * 200}
                />
                <span
                  className={cn(
                    "num rounded-sm border px-1.5 py-0.5 text-[10px]",
                    row.status === "VENCEDOR" ? "border-neon/30 bg-neon/10 text-neon" : "border-line-strong text-ink-faint",
                  )}
                >
                  {row.status}
                </span>
                <span className="num w-14 text-right text-xs text-ink">{row.roas}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}

/* ── Dor → contraste ─────────────────────────────────────────────────── */

function PainStrip() {
  return (
    <section className="border-b border-line bg-surface-1">
      <div className="mx-auto grid w-full max-w-6xl gap-px overflow-hidden px-5 py-14 md:grid-cols-2 md:gap-10">
        <Reveal>
          <p className="microlabel text-loss">O modelo quebrado</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Cinco fornecedores. Zero accountability.
          </h2>
          <ul className="mt-5 flex flex-col gap-2.5 text-sm leading-relaxed text-ink-mute">
            <li>— Produtora entrega vídeo bonito que não converte.</li>
            <li>— Gestor de tráfego culpa o criativo. O criativo culpa a oferta.</li>
            <li>— Relatório chega no dia 15, sem dizer o que fazer.</li>
            <li>— E uma fatia do seu orçamento morre em cliques fraudulentos que ninguém mede.</li>
          </ul>
        </Reveal>
        <Reveal delay={130}>
          <p className="microlabel text-neon">O modelo Perseo</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Um parceiro dono do funil inteiro.
          </h2>
          <ul className="mt-5 flex flex-col gap-2.5 text-sm leading-relaxed text-ink-mute">
            <li className="text-ink">→ Pesquisa, criativo, mídia, landing e relatório no mesmo cérebro.</li>
            <li>→ Ciclo de teste contínuo: hipótese, vídeo, dado, próxima iteração.</li>
            <li>→ ROAS auditado contra fraude antes de qualquer decisão.</li>
            <li>→ Operação alavancada por IA: velocidade de squad, senioridade de partner.</li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Metodologia ─────────────────────────────────────────────────────── */

const PHASES = [
  {
    n: "01",
    title: "Inteligência de mercado",
    desc: "Varremos a Meta Ad Library dos seus concorrentes: ângulos, hooks, ofertas e frequência de teste. Você começa sabendo o que já funciona no seu nicho.",
  },
  {
    n: "02",
    title: "Criativos UGC em escala",
    desc: "Roteiros de direct response gerados sobre a pesquisa, produção 9:16 com avatares e edição AI-first. Volume de teste semanal, não mensal.",
  },
  {
    n: "03",
    title: "Distribuição & landing",
    desc: "Publicação orgânica e paga, landing pages que sustentam a promessa do criativo e capturam o lead sem atrito.",
  },
  {
    n: "04",
    title: "Tracking anti-fraude",
    desc: "CPA, hook rate e ROAS por criativo — com auditoria de cliques fraudulentos. Decisão sobre número limpo, não inflado.",
  },
  {
    n: "05",
    title: "Relatório que decide",
    desc: "Relatório mensal automático: vencedores, perdedores, aprendizados no Knowledge Graph e o plano do próximo ciclo.",
  },
];

function Methodology() {
  return (
    <section id="metodologia" className="scroll-mt-20 border-b border-line">
      <div className="mx-auto w-full max-w-6xl px-5 py-20">
        <Reveal>
          <p className="microlabel">Metodologia</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
            Full-funnel de verdade: cada fase alimenta a próxima.
          </h2>
          <FunnelFlow />
        </Reveal>
        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-5">
          {PHASES.map((p, i) => (
            <Reveal key={p.n} delay={i * 80}>
              <article className="h-full bg-surface-2 p-5 transition-colors hover:bg-surface-3">
                <span className="num text-[11px] text-neon">{p.n}</span>
                <h3 className="mt-2 text-sm font-semibold text-ink">{p.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-mute">{p.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Capacidades (bento) ─────────────────────────────────────────────── */

const CAPABILITIES = [
  {
    icon: Radar,
    title: "Espionagem de concorrentes",
    desc: "Coleta contínua da Meta Ad Library — quais ângulos seus concorrentes escalam e quais abandonam.",
    span: "md:col-span-2",
  },
  {
    icon: Clapperboard,
    title: "Vídeo 9:16 nativo",
    desc: "UGC com avatares de IA, hooks testáveis em lote.",
    span: "",
  },
  {
    icon: ShieldAlert,
    title: "Auditoria de fraude",
    desc: "fraud_rate e cliques inválidos medidos por campanha.",
    span: "",
  },
  {
    icon: Activity,
    title: "Tracking por criativo",
    desc: "Hook rate, CPA e ROAS de cada vídeo — o vencedor é matemático, não opinião.",
    span: "md:col-span-2",
  },
  {
    icon: BrainCircuit,
    title: "Roteiros por IA",
    desc: "Dezenas de variações de ângulo e hook por ciclo, sobre a dor real da audiência.",
    span: "md:col-span-2",
  },
  {
    icon: Network,
    title: "Knowledge Graph",
    desc: "Cada teste vira memória: dor → ângulo → hook → resultado.",
    span: "",
  },
  {
    icon: Workflow,
    title: "Funil integrado",
    desc: "Lead do anúncio ao agendamento, com follow-up automático.",
    span: "",
  },
  {
    icon: FileBarChart,
    title: "Relatório automático",
    desc: "Mensal, por escrito, com decisão — não um PDF de vaidade.",
    span: "md:col-span-2",
  },
];

function Capabilities() {
  return (
    <section id="capacidades" className="scroll-mt-20 border-b border-line bg-surface-1">
      <div className="mx-auto w-full max-w-6xl px-5 py-20">
        <Reveal>
          <p className="microlabel">Capacidades</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
            O stack que cobre ~80% do seu funil de aquisição.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {CAPABILITIES.map((c, i) => (
            <Reveal key={c.title} delay={i * 60} className={c.span}>
              <article className="h-full rounded-lg border border-line bg-surface-2 p-5 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong">
                <c.icon className="size-5 text-neon" aria-hidden />
                <h3 className="mt-3 text-sm font-semibold text-ink">{c.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-mute">{c.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Fraude ──────────────────────────────────────────────────────────── */

function FraudSection() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2">
        <Reveal>
          <p className="microlabel text-loss">Auditoria de fraude</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Quanto do seu ROAS é mentira?</h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-mute">
            Cliques de bot e tráfego inválido inflam métricas e queimam orçamento em silêncio.
            Toda conta Perseo roda com auditoria de fraude contínua — e todo ROAS que você vê
            já está ajustado pela taxa de fraude medida.
          </p>
          <Link href="#contato" className="mt-6 inline-block">
            <Button variant="outline">Auditar minha conta →</Button>
          </Link>
        </Reveal>
        <Reveal delay={130} className="rounded-xl border border-line-strong bg-surface-2 p-6">
          <p className="microlabel mb-4">fórmula de decisão</p>
          <p className="num text-lg leading-relaxed text-ink md:text-xl">
            ROAS<sub className="text-ink-faint">real</sub> = ROAS<sub className="text-ink-faint">reportado</sub>
          </p>
          <p className="num mt-1 text-lg leading-relaxed text-neon md:text-xl">× (1 − fraud_rate)</p>
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line">
            <div className="bg-surface-1 p-4">
              <p className="microlabel">reportado pela plataforma</p>
              <p className="num mt-1 text-2xl text-ink">3.40×</p>
            </div>
            <div className="bg-surface-1 p-4">
              <p className="microlabel">com 12% de fraude</p>
              <p className="num mt-1 text-2xl text-loss">2.99×</p>
            </div>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-ink-faint">
            Exemplo ilustrativo. A diferença entre escalar um vencedor de verdade e escalar um erro caro.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Ofertas ─────────────────────────────────────────────────────────── */

const OFFERS = [
  {
    name: "Relatório de Inteligência",
    price: "US$ 300–500",
    cadence: "one-off",
    desc: "Raio-X dos seus 5 maiores concorrentes: ângulos, hooks, ofertas e gaps — + auditoria de fraude da sua conta.",
    bullets: ["Meta Ad Library mapeada", "Auditoria de fraude inclusa", "Plano de ataque por escrito"],
    cta: "Começar pelo raio-X",
    featured: false,
  },
  {
    name: "Engine de Criativos",
    price: "retainer",
    cadence: "Starter / Growth",
    desc: "A máquina de teste: pesquisa viva, roteiros, UGC 9:16 e leitura de hook rate — ciclo semanal.",
    bullets: ["Lote de criativos por ciclo", "Copy de direct response", "Tracking por criativo"],
    cta: "Montar minha engine",
    featured: true,
  },
  {
    name: "Full-Funnel Partner",
    price: "US$ 8–15k/mês",
    cadence: "premium",
    desc: "Funil completo sob um só cérebro: inteligência, criativo, mídia, landing, agente de IA e relatório.",
    bullets: ["Tudo da Engine, sem limite de fase", "Landing + funil de leads", "War room mensal de decisão"],
    cta: "Aplicar para vaga",
    featured: false,
  },
];

function Offers() {
  return (
    <section id="ofertas" className="scroll-mt-20 border-b border-line bg-surface-1">
      <div className="mx-auto w-full max-w-6xl px-5 py-20">
        <p className="microlabel">Escada de ofertas</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
          Comece pequeno. Escale quando o número provar.
        </h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {OFFERS.map((o, i) => (
            <Reveal key={o.name} delay={i * 110}>
              <article
                className={cn(
                  "relative flex h-full flex-col rounded-xl border p-6 transition-transform duration-200 hover:-translate-y-1",
                  o.featured ? "border-neon/40 bg-surface-2" : "border-line bg-surface-2",
                )}
              >
                {o.featured && (
                  <span aria-hidden className="neon-pulse pointer-events-none absolute -inset-px rounded-xl shadow-neon" />
                )}
                {o.featured ? <p className="microlabel mb-3 text-neon">mais procurado</p> : <p className="microlabel mb-3">{o.cadence}</p>}
                <h3 className="text-lg font-semibold text-ink">{o.name}</h3>
                <p className="num mt-1 text-sm text-ink-mute">{o.price}</p>
                <p className="mt-3 text-xs leading-relaxed text-ink-mute">{o.desc}</p>
                <ul className="mt-4 flex flex-col gap-2 text-xs text-ink">
                  {o.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <span aria-hidden className="mt-1 size-1 shrink-0 rounded-full bg-neon" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link href="#contato" className="mt-6">
                  <Button variant={o.featured ? "primary" : "outline"} className="w-full">
                    {o.cta} →
                  </Button>
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-ink-faint">
          Também operamos à la carte (logo, brand kit, landing) e white-label para outras agências.
        </p>
      </div>
    </section>
  );
}

/* ── CTA final ───────────────────────────────────────────────────────── */

function FinalCta() {
  return (
    <section id="contato" className="scroll-mt-20">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <p className="microlabel">Próximo passo</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Peça a análise gratuita do seu nicho.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-mute">
            Em até 1 dia útil você recebe os primeiros achados: o que seus concorrentes estão
            escalando, onde seu funil vaza e por onde a Perseo atacaria primeiro.
          </p>
          <ul className="mt-6 flex flex-col gap-2.5 text-xs text-ink-mute">
            <li className="flex items-center gap-2">
              <span aria-hidden className="size-1 rounded-full bg-neon" /> Para marcas D2C/e-commerce já investindo em ads
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="size-1 rounded-full bg-neon" /> Resposta por escrito — sem call obrigatória
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="size-1 rounded-full bg-neon" /> Vagas limitadas pela capacidade de operação
            </li>
          </ul>
        </Reveal>
        <Reveal delay={130} className="rounded-xl border border-line bg-surface-2 p-6">
          <LeadForm />
        </Reveal>
      </div>
    </section>
  );
}
