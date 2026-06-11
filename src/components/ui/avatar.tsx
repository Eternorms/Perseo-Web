import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

/** Avatar de iniciais — sem imagens externas no MVP. */
export function Avatar({
  name,
  className,
  tone = "default",
}: {
  name: string | null | undefined;
  className?: string;
  tone?: "default" | "neon";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold",
        tone === "neon" ? "border-neon/30 bg-neon/10 text-neon" : "border-line-strong bg-surface-3 text-ink-mute",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
