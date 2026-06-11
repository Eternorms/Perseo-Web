import { cn } from "@/lib/utils";

/** Lista de barras horizontais — funis, rankings, distribuição. */
export function HBarList({
  items,
  className,
}: {
  items: Array<{
    label: string;
    value: number;
    display?: string;
    color?: string;
    sub?: string;
  }>;
  className?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {items.map((item, idx) => (
        <div key={idx}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate text-ink-mute">{item.label}</span>
            <span className="num shrink-0 text-ink">
              {item.display ?? item.value.toLocaleString("pt-BR")}
              {item.sub ? <span className="ml-1.5 text-[10px] text-ink-faint">{item.sub}</span> : null}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 2 : 0)}%`, background: item.color ?? "#5BA3FF" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
