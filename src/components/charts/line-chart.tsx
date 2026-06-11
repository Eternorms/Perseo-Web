import { cn } from "@/lib/utils";

export interface Series {
  label: string;
  color: string;
  points: Array<number | null>;
}

/**
 * Gráfico de linha/área SVG puro — renderiza no servidor, sem JS no cliente.
 * Eixo X categórico (datas), Y auto-escala com folga de 8%.
 */
export function LineChart({
  series,
  xLabels,
  height = 180,
  className,
  formatY = (v) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
  area = true,
}: {
  series: Series[];
  xLabels: string[];
  height?: number;
  className?: string;
  formatY?: (v: number) => string;
  area?: boolean;
}) {
  const W = 720;
  const H = height;
  const PAD_L = 46;
  const PAD_R = 10;
  const PAD_T = 10;
  const PAD_B = 22;

  const values = series.flatMap((s) => s.points.filter((p): p is number => p != null));
  if (values.length === 0 || xLabels.length === 0) {
    return (
      <div className={cn("flex items-center justify-center text-xs text-ink-faint", className)} style={{ height }}>
        Sem dados no período
      </div>
    );
  }

  const max = Math.max(...values) * 1.08 || 1;
  const min = Math.min(0, ...values);
  const n = xLabels.length;
  const x = (i: number) => PAD_L + (n <= 1 ? 0 : (i / (n - 1)) * (W - PAD_L - PAD_R));
  const y = (v: number) => PAD_T + (1 - (v - min) / (max - min || 1)) * (H - PAD_T - PAD_B);

  const gridYs = [0.25, 0.5, 0.75, 1].map((f) => min + f * (max - min));
  const labelEvery = Math.max(1, Math.ceil(n / 8));

  function path(points: Array<number | null>, close: boolean): string {
    let d = "";
    let started = false;
    points.forEach((p, i) => {
      if (p == null) return;
      d += started ? ` L ${x(i).toFixed(1)} ${y(p).toFixed(1)}` : `M ${x(i).toFixed(1)} ${y(p).toFixed(1)}`;
      started = true;
    });
    if (close && started) {
      const lastIdx = points.length - 1;
      d += ` L ${x(lastIdx).toFixed(1)} ${y(Math.max(min, 0)).toFixed(1)} L ${x(0).toFixed(1)} ${y(Math.max(min, 0)).toFixed(1)} Z`;
    }
    return d;
  }

  return (
    <figure className={className}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Série temporal" className="w-full">
        {gridYs.map((v, i) => (
          <g key={i}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(v)} y2={y(v)} stroke="#1B202A" strokeDasharray="3 5" />
            <text x={PAD_L - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="#5A6170" fontFamily="var(--font-mono)">
              {formatY(v)}
            </text>
          </g>
        ))}
        {xLabels.map((l, i) =>
          i % labelEvery === 0 ? (
            <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#5A6170" fontFamily="var(--font-mono)">
              {l}
            </text>
          ) : null,
        )}
        {series.map((s) =>
          area ? <path key={`a-${s.label}`} d={path(s.points, true)} fill={s.color} opacity="0.07" /> : null,
        )}
        {series.map((s) => (
          <path key={s.label} d={path(s.points, false)} fill="none" stroke={s.color} strokeWidth="1.75" />
        ))}
        {series.map((s) => {
          let lastIdx = -1;
          s.points.forEach((p, i) => {
            if (p != null) lastIdx = i;
          });
          const last = lastIdx >= 0 ? s.points[lastIdx] : null;
          return last != null ? <circle key={`d-${s.label}`} cx={x(lastIdx)} cy={y(last)} r="2.5" fill={s.color} /> : null;
        })}
      </svg>
      {series.length > 1 ? (
        <figcaption className="mt-2 flex flex-wrap gap-4">
          {series.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5 text-[11px] text-ink-mute">
              <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </figcaption>
      ) : null}
    </figure>
  );
}
