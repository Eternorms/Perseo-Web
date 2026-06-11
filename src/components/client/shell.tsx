"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Clapperboard,
  FileBarChart,
  LayoutDashboard,
  MessageSquare,
  Settings,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { signOutAction } from "@/lib/actions/auth";
import { markNotificationsReadAction } from "@/lib/actions/messages";
import { createClient } from "@/lib/supabase/client";
import { fmtRelative } from "@/lib/format";
import type { ClientNotificationRow } from "@/types/database";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/criativos", label: "Criativos", icon: Clapperboard },
  { href: "/client/appointments", label: "Agendamentos", icon: CalendarDays },
  { href: "/client/messages", label: "Mensagens", icon: MessageSquare },
  { href: "/client/reports", label: "Relatórios", icon: FileBarChart },
  { href: "/client/settings", label: "Configurações", icon: Settings },
];

export function ClientShell({
  clientId,
  clientName,
  userName,
  notifications,
  children,
}: {
  clientId: string;
  clientName: string;
  userName: string;
  notifications: ClientNotificationRow[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // realtime: novas notificações / agendamentos → refresh do shell
  React.useEffect(() => {
    const supabase = createClient();
    let timer: number | undefined;
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => router.refresh(), 400);
    };
    const channel = supabase
      .channel(`portal-${clientId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "client_notifications", filter: `client_id=eq.${clientId}` },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `client_id=eq.${clientId}` },
        refresh,
      )
      .subscribe();
    return () => {
      window.clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [clientId, router]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line glass">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-3">
            <Link href="/client/dashboard" aria-label="Dashboard">
              <Logo compact />
            </Link>
            <span aria-hidden className="h-5 w-px bg-line" />
            <span className="truncate text-sm font-medium text-ink">{clientName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationsBell notifications={notifications} />
            <div className="ml-1 hidden items-center gap-2 sm:flex">
              <Avatar name={userName} className="size-7 text-[10px]" />
              <form action={signOutAction}>
                <button type="submit" className="text-xs text-ink-faint transition-colors hover:text-ink">
                  Sair
                </button>
              </form>
            </div>
          </div>
        </div>
        <nav aria-label="Portal do cliente" className="mx-auto w-full max-w-6xl overflow-x-auto px-5">
          <ul className="flex gap-1">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] transition-colors",
                      active
                        ? "border-neon font-medium text-ink"
                        : "border-transparent text-ink-mute hover:border-line-strong hover:text-ink",
                    )}
                  >
                    <item.icon className={cn("size-3.5", active ? "text-neon" : "text-ink-faint")} aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
          <p className="text-[11px] text-ink-faint">Operado pela Perseo — fale com seu estrategista em Mensagens.</p>
          <p className="microlabel">perseo · portal</p>
        </div>
      </footer>
    </div>
  );
}

function NotificationsBell({ notifications }: { notifications: ClientNotificationRow[] }) {
  const [open, setOpen] = React.useState(false);
  const unread = notifications.filter((n) => !n.read_at).length;
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label={`Notificações${unread > 0 ? ` (${unread} não lidas)` : ""}`}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open && unread > 0) void markNotificationsReadAction();
        }}
        className="relative rounded-md p-2 text-ink-mute transition-colors hover:bg-surface-3 hover:text-ink"
      >
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="num absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-neon text-[9px] font-semibold text-onneon">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notificações recentes"
          className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-line-strong glass p-1.5 shadow-xl shadow-black/50 animate-fade"
        >
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-ink-faint">Nenhuma notificação ainda.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="rounded-md px-3 py-2.5 transition-colors hover:bg-surface-3/60">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={cn("text-[13px]", n.read_at ? "text-ink-mute" : "font-medium text-ink")}>{n.title}</p>
                    <span className="num shrink-0 text-[10px] text-ink-faint">{fmtRelative(n.created_at)}</span>
                  </div>
                  {n.body ? <p className="mt-0.5 text-[11px] leading-relaxed text-ink-faint">{n.body}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
