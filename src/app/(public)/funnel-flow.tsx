import type { CSSProperties } from "react";

/**
 * Funil de aquisição ilustrativo — 5 segmentos afunilando da esquerda
 * (mercado inteiro) para a direita (decisão limpa). Acende em sequência
 * quando a seção revela (CSS gated em `.is-visible` do Reveal pai) e a
 * linha de fluxo pulsa continuamente. Server component: animação 100% CSS.
 */

/* alturas das bordas de cada segmento (% do container) — silhueta do funil */
const EDGES = [100, 76, 56, 40, 28, 20];

const STAGES = [
  { n: "01", label: "mercado" },
  { n: "02", label: "criativos" },
  { n: "03", label: "leads" },
  { n: "04", label: "número limpo" },
  { n: "05", label: "decisão" },
];

export function FunnelFlow() {
  return (
    <div aria-hidden className="mt-10 select-none">
      <div className="relative h-24 md:h-32">
        <div className="flex h-full">
          {STAGES.map((s, i) => (
            <div
              key={s.n}
              className="funnel-seg flex-1"
              style={{ "--hl": `${EDGES[i]}%`, "--hr": `${EDGES[i + 1]}%`, "--i": i } as CSSProperties}
            />
          ))}
        </div>
        <svg className="absolute inset-x-0 top-1/2 h-px w-full -translate-y-1/2 overflow-visible">
          <line
            x1="0"
            y1="0.5"
            x2="100%"
            y2="0.5"
            stroke="rgba(0,255,65,0.55)"
            strokeWidth="1"
            strokeDasharray="5 11"
            className="flow-line"
          />
        </svg>
      </div>
      <div className="mt-3 flex">
        {STAGES.map((s, i) => (
          <div key={s.n} className="funnel-label flex-1 text-center" style={{ "--i": i } as CSSProperties}>
            <span className="num text-[11px] text-neon">{s.n}</span>
            <span className="microlabel ml-1.5 hidden md:inline">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="microlabel">→ volume entra</span>
        <span className="microlabel text-neon">decisão limpa sai →</span>
      </div>
    </div>
  );
}
