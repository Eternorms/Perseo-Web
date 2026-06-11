import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-20 w-full rounded-md border border-line bg-surface-1 px-3 py-2 text-sm text-ink placeholder:text-ink-faint",
        "transition-colors focus-visible:border-neon/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
