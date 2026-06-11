import { cn } from "@/lib/utils";

/**
 * Delta de métrica: ▲/▼ + valor mono. `goodWhen` define a semântica —
 * CPA caindo é positivo, ROAS subindo é positivo.
 */
export function Delta({
  value,
  suffix = "%",
  goodWhen = "up",
  className,
}: {
  value: number | null | undefined;
  suffix?: string;
  goodWhen?: "up" | "down";
  className?: string;
}) {
  if (value == null || Number.isNaN(value)) {
    return <span className={cn("num text-xs text-ink-faint", className)}>—</span>;
  }
  const up = value >= 0;
  const good = goodWhen === "up" ? up : !up;
  const abs = Math.abs(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  return (
    <span
      className={cn("num inline-flex items-center gap-0.5 text-xs", good ? "text-neon" : "text-loss", className)}
    >
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      <span className="sr-only">{up ? "subiu" : "caiu"}</span>
      {abs}
      {suffix}
    </span>
  );
}
