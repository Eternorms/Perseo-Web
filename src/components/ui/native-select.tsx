import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Select nativo estilizado — funciona em forms de server action sem JS,
 * teclado/leitor de tela nativos.
 */
export function NativeSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={cn("relative inline-flex w-full", className)}>
      <select
        className={cn(
          "h-9 w-full appearance-none rounded-md border border-line bg-surface-1 pl-3 pr-8 text-sm text-ink",
          "transition-colors focus-visible:border-neon/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/20",
          "disabled:cursor-not-allowed disabled:opacity-50 [&_option]:bg-surface-1",
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
    </span>
  );
}
