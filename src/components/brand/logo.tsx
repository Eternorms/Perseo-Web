import { cn } from "@/lib/utils";

/** Wordmark Perseo — “P” sólido + ponto neon (sinal). */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex select-none items-center gap-2", className)}>
      <svg viewBox="0 0 64 64" aria-hidden className="size-6 shrink-0">
        <rect width="64" height="64" rx="14" fill="#161A22" />
        <path
          d="M22 50V14h14.5c7.7 0 13 4.9 13 12s-5.3 12-13 12H30v12h-8zm8-19h6c3.4 0 5.4-1.9 5.4-5s-2-5-5.4-5h-6v10z"
          fill="#EDEFF3"
        />
        <circle cx="47" cy="49" r="5" fill="#00FF41" />
      </svg>
      {!compact ? <span className="text-sm font-semibold tracking-[0.18em] text-ink">PERSEO</span> : null}
    </span>
  );
}
