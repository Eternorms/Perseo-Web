/** Sparkline inline (tabelas densas, KPI ribbon). SVG puro. */
export function Sparkline({
  points,
  color = "#00FF41",
  width = 96,
  height = 26,
  draw = false,
  drawDelay = 0,
}: {
  points: number[];
  color?: string;
  width?: number;
  height?: number;
  /** anima o traço desenhando da esquerda para a direita (landing) */
  draw?: boolean;
  /** atraso extra da animação em ms (stagger entre linhas) */
  drawDelay?: number;
}) {
  if (points.length < 2) {
    return <span className="text-[10px] text-ink-faint">—</span>;
  }
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const x = (i: number) => (i / (points.length - 1)) * (width - 2) + 1;
  const y = (v: number) => height - 2 - ((v - min) / range) * (height - 4);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p).toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} aria-hidden className="shrink-0">
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        pathLength={draw ? 1 : undefined}
        className={draw ? "spark-draw" : undefined}
        style={draw && drawDelay > 0 ? { animationDelay: `${500 + drawDelay}ms` } : undefined}
      />
    </svg>
  );
}
