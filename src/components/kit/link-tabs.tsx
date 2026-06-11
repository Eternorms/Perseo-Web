import Link from "next/link";
import { cn } from "@/lib/utils";

/** Tabs por URL (?tab= ou rota) — server-friendly, estado compartilhável. */
export function LinkTabs({
  tabs,
  active,
  className,
}: {
  tabs: Array<{ value: string; label: string; href: string; count?: number }>;
  active: string;
  className?: string;
}) {
  return (
    <nav className={cn("flex gap-1 overflow-x-auto border-b border-line", className)} aria-label="Abas">
      {tabs.map((t) => {
        const isActive = t.value === active;
        return (
          <Link
            key={t.value}
            href={t.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-[13px] transition-colors",
              isActive
                ? "border-neon font-medium text-ink"
                : "border-transparent text-ink-mute hover:border-line-strong hover:text-ink",
            )}
          >
            {t.label}
            {t.count !== undefined ? (
              <span className="num rounded-sm bg-surface-3 px-1 text-[10px] text-ink-mute">{t.count}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
