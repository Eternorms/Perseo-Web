"use client";

import * as React from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Modal e Drawer (sheet lateral) sobre Base UI — foco gerenciado, ESC,
 * aria por padrão. Glass apenas no backdrop (UI flutuante).
 */

export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

function Backdrop() {
  return (
    <BaseDialog.Backdrop
      className={cn(
        "fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]",
        "transition-opacity duration-200 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
      )}
    />
  );
}

export function DialogContent({
  className,
  children,
  title,
  description,
}: {
  className?: string;
  children: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <BaseDialog.Portal>
      <Backdrop />
      <BaseDialog.Popup
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
          "rounded-lg border border-line-strong bg-surface-2 shadow-2xl shadow-black/60",
          "transition-all duration-200 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <BaseDialog.Title className="text-sm font-semibold text-ink">{title}</BaseDialog.Title>
            {description ? (
              <BaseDialog.Description className="mt-0.5 text-xs text-ink-mute">{description}</BaseDialog.Description>
            ) : null}
          </div>
          <BaseDialog.Close
            aria-label="Fechar"
            className="rounded-sm p-1 text-ink-faint transition-colors hover:bg-surface-3 hover:text-ink"
          >
            <X className="size-4" />
          </BaseDialog.Close>
        </div>
        <div className="px-5 py-4">{children}</div>
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

/** Drawer lateral direito — detalhe denso (studio, criativos, leads). */
export function SheetContent({
  className,
  children,
  title,
  description,
  wide,
}: {
  className?: string;
  children: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <BaseDialog.Portal>
      <Backdrop />
      <BaseDialog.Popup
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line-strong bg-surface-1",
          wide ? "max-w-2xl" : "max-w-md",
          "transition-transform duration-300 ease-out data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <BaseDialog.Title className="truncate text-sm font-semibold text-ink">{title}</BaseDialog.Title>
            {description ? (
              <BaseDialog.Description className="mt-0.5 text-xs text-ink-mute">{description}</BaseDialog.Description>
            ) : null}
          </div>
          <BaseDialog.Close
            aria-label="Fechar"
            className="rounded-sm p-1 text-ink-faint transition-colors hover:bg-surface-3 hover:text-ink"
          >
            <X className="size-4" />
          </BaseDialog.Close>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex justify-end gap-2", className)} {...props} />;
}
