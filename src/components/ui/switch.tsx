import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Switch baseado em checkbox nativo — submete em forms de server action
 * (name=...) e mantém teclado/aria nativos.
 */
export function Switch({
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <input type="checkbox" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className={cn(
          "h-5 w-9 cursor-pointer rounded-full border border-line-strong bg-surface-3 transition-colors duration-150",
          "after:absolute after:left-0.5 after:top-1/2 after:size-4 after:-translate-y-1/2 after:rounded-full after:bg-ink-mute after:transition-transform after:duration-150",
          "peer-checked:border-neon/40 peer-checked:bg-neon/20 peer-checked:after:translate-x-4 peer-checked:after:bg-neon",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-neon",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        )}
      />
    </span>
  );
}
