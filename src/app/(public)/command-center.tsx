"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/components/charts/sparkline";
import { cn } from "@/lib/utils";

/**
 * Command Center interativo — o visitante VIRA o gestor de tráfego:
 * escala o vencedor (vira tag dourada), corta o teste que cai, e ao
 * escalar 3 criativos o painel libera o card-recompensa (CTA), que ao
 * fechar reinicia o ciclo. Máquina de estados linear de 12 fases.
 *
 * Fases de usuário (clique): 0 escala A · 2 corta B · 4 escala C ·
 * 7 corta D · 9 escala E · 11 fecha card. As demais avançam sozinhas.
 */

type Status = "TESTE" | "VENCEDOR" | "CAINDO" | "ESCALA";
type Action = "scale" | "kill" | null;

interface Row {
  id: string;
  name: string;
  pts: number[];
  status: Status;
  roas: string;
  action: Action;
  enter?: boolean;
  leaving?: boolean;
}

interface Scene {
  rows: Row[];
  scaled: number;
  reward: boolean;
}

/* séries de sparkline por momento do criativo */
const P = {
  winA: [2, 3, 2.8, 3.4, 3.9, 4.0],
  sclA: [2.8, 3.2, 3.6, 3.9, 4.2, 4.4],
  tstB: [1.5, 1.8, 2.4, 2.1, 2.2, 2.3],
  flB: [2.3, 2.1, 1.8, 1.4, 1.1, 0.8],
  tstC: [1, 1.6, 1.4, 1.9, 1.8, 1.9],
  winC: [1.9, 2.3, 2.6, 3.0, 3.2, 3.4],
  sclC: [2.6, 3.0, 3.3, 3.6, 3.8, 4.0],
  tstD: [1.4, 1.9, 1.6, 2.0, 1.8, 1.9],
  flD: [1.9, 1.7, 1.4, 1.1, 0.9, 0.7],
  tstE: [1.6, 2.0, 2.2, 2.4, 2.6, 2.7],
  winE: [2.0, 2.4, 2.8, 3.2, 3.5, 3.8],
  sclE: [2.8, 3.2, 3.5, 3.8, 4.0, 4.2],
};

const A = (over: Partial<Row>): Row => ({ id: "A", name: "UGC-014 · dor → rotina", pts: P.sclA, status: "ESCALA", roas: "4.31×", action: null, ...over });
const C = (over: Partial<Row>): Row => ({ id: "C", name: "UGC-021 · unboxing POV", pts: P.sclC, status: "ESCALA", roas: "3.74×", action: null, ...over });
const E = (over: Partial<Row>): Row => ({ id: "E", name: "UGC-031 · antes / depois", pts: P.sclE, status: "ESCALA", roas: "3.92×", action: null, ...over });

/* fase → cena. Atalhos A()/C()/E() padronizam o estado "escalado". */
const SCENES: Scene[] = [
  // 0 — início: A vence, B e C em teste (usuário escala A)
  {
    scaled: 0,
    reward: false,
    rows: [
      A({ status: "VENCEDOR", roas: "4.02×", pts: P.winA, action: "scale" }),
      { id: "B", name: "UGC-019 · prova social", pts: P.tstB, status: "TESTE", roas: "2.31×", action: null },
      C({ status: "TESTE", roas: "1.87×", pts: P.tstC }),
    ],
  },
  // 1 — A escalado (auto)
  {
    scaled: 1,
    reward: false,
    rows: [A({}), { id: "B", name: "UGC-019 · prova social", pts: P.tstB, status: "TESTE", roas: "2.31×", action: null }, C({ status: "TESTE", roas: "1.87×", pts: P.tstC })],
  },
  // 2 — B cai (usuário corta)
  {
    scaled: 1,
    reward: false,
    rows: [A({}), { id: "B", name: "UGC-019 · prova social", pts: P.flB, status: "CAINDO", roas: "0.84×", action: "kill" }, C({ status: "TESTE", roas: "1.87×", pts: P.tstC })],
  },
  // 3 — B saindo (auto)
  {
    scaled: 1,
    reward: false,
    rows: [A({}), { id: "B", name: "UGC-019 · prova social", pts: P.flB, status: "CAINDO", roas: "0.84×", action: null, leaving: true }, C({ status: "TESTE", roas: "1.87×", pts: P.tstC })],
  },
  // 4 — C vira vencedor (usuário escala)
  { scaled: 1, reward: false, rows: [A({}), C({ status: "VENCEDOR", roas: "3.40×", pts: P.winC, action: "scale" })] },
  // 5 — C escalado (auto)
  { scaled: 2, reward: false, rows: [A({}), C({})] },
  // 6 — entram 2 testes novos (auto)
  {
    scaled: 2,
    reward: false,
    rows: [A({}), C({}), { id: "D", name: "UGC-027 · depoimento real", pts: P.tstD, status: "TESTE", roas: "2.04×", action: null, enter: true }, { id: "E", name: "UGC-031 · antes / depois", pts: P.tstE, status: "TESTE", roas: "2.66×", action: null, enter: true }],
  },
  // 7 — D cai (usuário corta)
  {
    scaled: 2,
    reward: false,
    rows: [A({}), C({}), { id: "D", name: "UGC-027 · depoimento real", pts: P.flD, status: "CAINDO", roas: "0.71×", action: "kill" }, { id: "E", name: "UGC-031 · antes / depois", pts: P.tstE, status: "TESTE", roas: "2.66×", action: null }],
  },
  // 8 — D saindo (auto)
  {
    scaled: 2,
    reward: false,
    rows: [A({}), C({}), { id: "D", name: "UGC-027 · depoimento real", pts: P.flD, status: "CAINDO", roas: "0.71×", action: null, leaving: true }, { id: "E", name: "UGC-031 · antes / depois", pts: P.tstE, status: "TESTE", roas: "2.66×", action: null }],
  },
  // 9 — E vira vencedor (usuário escala)
  { scaled: 2, reward: false, rows: [A({}), C({}), E({ status: "VENCEDOR", roas: "3.80×", pts: P.winE, action: "scale" })] },
  // 10 — E escalado, 3/3 (auto)
  { scaled: 3, reward: false, rows: [A({}), C({}), E({})] },
  // 11 — card-recompensa
  { scaled: 3, reward: true, rows: [A({}), C({}), E({})] },
];

/* fases que avançam sozinhas → atraso (ms) */
const AUTO: Record<number, number> = { 1: 900, 3: 440, 5: 800, 6: 1000, 8: 440, 10: 700 };

const SPARK: Record<Status, string> = {
  TESTE: "#5BA3FF",
  VENCEDOR: "#00FF41",
  CAINDO: "#FF3D5A",
  ESCALA: "#FFC846",
};

function tagClass(status: Status) {
  switch (status) {
    case "VENCEDOR":
      return "border-neon/30 bg-neon/10 text-neon";
    case "ESCALA":
      return "border-warn/40 bg-warn/10 text-warn";
    case "CAINDO":
      return "border-loss/40 bg-loss/10 text-loss";
    default:
      return "border-line-strong text-ink-faint";
  }
}

const kpis = [
  { label: "ROAS AJUSTADO", value: "3.40×", delta: "▲ 9,6%" },
  { label: "CPA", value: "R$ 39,80", delta: "▼ 11,4%" },
  { label: "HOOK RATE", value: "32,8%", delta: "▲ 4,2%" },
  { label: "FRAUDE", value: "5,6%", delta: "▼ 1,9%" },
];

export function CommandCenter() {
  const [phase, setPhase] = useState(0);
  const scene = SCENES[phase];

  // avanço automático das fases de transição
  useEffect(() => {
    const delay = AUTO[phase];
    if (delay == null) return;
    const t = setTimeout(() => setPhase((p) => p + 1), delay);
    return () => clearTimeout(t);
  }, [phase]);

  const act = (action: Action) => {
    if (action === "scale" || action === "kill") setPhase((p) => p + 1);
  };

  return (
    <figure
      className="mx-auto mt-16 max-w-4xl animate-rise text-left [animation-delay:360ms]"
      role="group"
      aria-label="Demonstração interativa: escale os criativos vencedores"
    >
      <div className="overflow-hidden rounded-xl border border-line-strong bg-surface-1 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="microlabel">perseo · command center</span>
          <span className="flex items-center gap-3">
            <span className="num text-[11px] text-ink-faint">
              escalados <span className="text-warn">{scene.scaled}</span>/3
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-neon">
              <span className="size-1.5 rounded-full bg-neon animate-live" />
              live
            </span>
          </span>
        </div>

        <div className="grid grid-cols-2 divide-x divide-line border-b border-line md:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="px-4 py-3.5">
              <div className="microlabel">{k.label}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="num text-lg text-ink">{k.value}</span>
                <span className="num text-[11px] text-neon">{k.delta}</span>
              </div>
            </div>
          ))}
        </div>

        {/* hint de interação — some após o primeiro clique */}
        {phase === 0 && (
          <div className="hidden animate-rise items-center gap-2 border-b border-line bg-neon/[0.03] px-4 py-2 text-[11px] text-ink-mute md:flex">
            <span className="text-neon">▸</span>
            você é o gestor de tráfego: escale o vencedor <span className="text-neon">↗</span> e corte o que cai
          </div>
        )}

        {/* área de criativos — reward sobe por cima */}
        <div className={cn("relative hidden md:block", scene.reward ? "min-h-[250px]" : "min-h-[170px]")}>
          <div className="divide-y divide-line">
            {scene.rows.map((row) => (
              <CreativeRow key={row.id} row={row} first={phase === 0 && row.action === "scale"} onAct={() => act(row.action)} />
            ))}
          </div>

          {scene.reward && (
            <div
              className="cc-reward absolute inset-0 z-10 flex flex-col items-center justify-center gap-3.5 px-6 text-center"
              style={{
                background: "radial-gradient(130% 100% at 50% 0%, rgba(255,200,87,0.10), rgba(10,12,16,0.97) 60%)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
              }}
            >
              <button
                type="button"
                onClick={() => setPhase(0)}
                aria-label="Fechar e reiniciar"
                className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface-3 hover:text-ink"
              >
                ✕
              </button>

              <span
                className="flex size-11 items-center justify-center rounded-full border border-warn/40 bg-warn/10 text-lg text-warn"
                style={{ boxShadow: "0 0 22px rgba(255,200,87,0.22)" }}
              >
                ✓
              </span>

              <div>
                <p className="num text-[11px] tracking-[0.18em] text-warn">3 CRIATIVOS ESCALADOS</p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink md:text-[15px]">
                  É assim que a Perseo opera seu funil: <span className="text-neon">escala o que vende</span>, corta o que drena — toda semana.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {[
                  ["UGC-014", "4.31×"],
                  ["UGC-021", "3.74×"],
                  ["UGC-031", "3.92×"],
                ].map(([id, r]) => (
                  <span
                    key={id}
                    className="num inline-flex items-center gap-1.5 rounded-sm border border-warn/30 bg-warn/[0.08] px-2 py-0.5 text-[10px] text-warn"
                  >
                    {id}
                    <span className="text-warn/60">{r}</span>
                  </span>
                ))}
              </div>

              <Link href="#contato" className="mt-1">
                <Button variant="primary" size="md">
                  Pedir análise gratuita →
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </figure>
  );
}

function CreativeRow({ row, first, onAct }: { row: Row; first: boolean; onAct: () => void }) {
  const right = (
    <span className="flex items-center gap-5">
      <Sparkline points={row.pts} width={88} height={22} color={SPARK[row.status]} />
      {row.action === "scale" ? (
        <span className="flex items-center gap-2">
          {first && <span className="num text-[10px] text-neon/80">clique →</span>}
          <button
            type="button"
            onClick={onAct}
            aria-label={`Escalar ${row.name}`}
            className="cc-scale-pulse num rounded-sm border border-neon/40 bg-neon/15 px-2 py-0.5 text-[10px] font-medium text-neon transition-colors hover:bg-neon/25"
          >
            ESCALAR ↗
          </button>
        </span>
      ) : (
        <span className={cn("num rounded-sm border px-1.5 py-0.5 text-[10px]", tagClass(row.status))}>{row.status}</span>
      )}
      <span className={cn("num w-14 text-right text-xs", row.status === "CAINDO" ? "text-loss" : "text-ink")}>{row.roas}</span>
    </span>
  );

  const body = (
    <>
      <span className="flex items-center gap-2 truncate">
        <span className={cn("num truncate text-xs", row.status === "CAINDO" ? "text-loss" : "text-ink-mute")}>{row.name}</span>
        {row.action === "kill" && <span className="num shrink-0 text-[10px] text-loss/80">✕ pausar</span>}
      </span>
      {right}
    </>
  );

  const base = cn("cc-row flex items-center justify-between gap-4 px-4 py-2.5", row.enter && "cc-row-enter", row.leaving && "cc-row-leaving");

  if (row.action === "kill") {
    return (
      <button type="button" onClick={onAct} aria-label={`Pausar ${row.name}`} className={cn(base, "cc-row-fall w-full text-left")}>
        {body}
      </button>
    );
  }
  return <div className={base}>{body}</div>;
}
