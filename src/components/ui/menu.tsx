"use client";

import * as React from "react";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";

/** Dropdown de ações (linhas de tabela, header). */

export const Menu = BaseMenu.Root;
export const MenuTrigger = BaseMenu.Trigger;
export const MenuSeparator = function Sep() {
  return <BaseMenu.Separator className="my-1 h-px bg-line" />;
};

export function MenuContent({ children, align = "end" }: { children: React.ReactNode; align?: "start" | "end" }) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner align={align} sideOffset={6} className="z-50">
        <BaseMenu.Popup
          className={cn(
            "min-w-44 rounded-md border border-line-strong glass p-1 shadow-xl shadow-black/50",
            "transition-all duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
          )}
        >
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export function MenuItem({
  className,
  danger,
  ...props
}: React.ComponentProps<typeof BaseMenu.Item> & { danger?: boolean }) {
  return (
    <BaseMenu.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-sm px-2.5 py-1.5 text-[13px] outline-none",
        danger
          ? "text-loss data-[highlighted]:bg-loss/10"
          : "text-ink data-[highlighted]:bg-surface-3 data-[highlighted]:text-ink",
        "[&_svg]:size-3.5 [&_svg]:text-ink-faint",
        className,
      )}
      {...props}
    />
  );
}
