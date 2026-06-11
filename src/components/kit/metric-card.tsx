import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Delta } from "@/components/kit/delta";

/**
 * Métrica = número mono no centro + label técnico + delta colorido.
 * Nunca adjetivo ("muito eficiente") — sempre número.
 */
export function MetricCard({
  label,
  value,
  delta,
  deltaGoodWhen = "up",
  hint,
  accent,
  className,
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaGoodWhen?: "up" | "down";
  /** sublinha o valor com neon — usar só para o KPI herói da tela */
  accent?: boolean;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={cn("px-4 py-3.5", className)}>
      <div className="microlabel">{label}</div>
      <div className="mt-1.5 flex items-baseline justify-between gap-2">
        <span className={cn("num text-2xl font-medium leading-none tracking-tight", accent ? "text-neon glow-neon" : "text-ink")}>
          {value}
        </span>
        {delta !== undefined ? <Delta value={delta} goodWhen={deltaGoodWhen} /> : null}
      </div>
      {hint ? <div className="mt-1.5 text-[11px] text-ink-faint">{hint}</div> : null}
    </Card>
  );
}
