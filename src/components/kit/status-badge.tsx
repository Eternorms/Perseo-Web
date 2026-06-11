import { Badge } from "@/components/ui/badge";
import type { Tone } from "@/lib/labels";

/** Badge de status orientado a dicionário ({label, tone}) de lib/labels. */
export function StatusBadge({ def, className }: { def: { label: string; tone: Tone }; className?: string }) {
  return (
    <Badge tone={def.tone} className={className}>
      {def.tone === "neon" ? <span aria-hidden className="size-1.5 rounded-full bg-neon animate-live" /> : null}
      {def.label}
    </Badge>
  );
}
