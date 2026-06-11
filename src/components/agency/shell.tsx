"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Brain,
  CalendarDays,
  Clapperboard,
  Filter,
  Kanban,
  LayoutDashboard,
  Menu as MenuIcon,
  MessageSquare,
  Send,
  Terminal,
  Users,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { signOutAction } from "@/lib/actions/auth";
import { Avatar } from "@/components/ui/avatar";
import { USER_TYPE } from "@/lib/labels";
import type { UserType } from "@/types/database";
import { cn } from "@/lib/utils";

const NAV_GROUPS: Array<{ label: string; items: Array<{ href: string; label: string; icon: React.ElementType }> }> = [
  {
    label: "Operação",
    items: [
      { href: "/agency/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/agency/clients", label: "Clientes", icon: Users },
      { href: "/agency/kanban", label: "Kanban", icon: Kanban },
      { href: "/agency/schedule", label: "Agenda", icon: CalendarDays },
      { href: "/agency/funis", label: "Funis", icon: Filter },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { href: "/agency/criativos", label: "Criativos", icon: Clapperboard },
      { href: "/agency/posts", label: "Posts", icon: Send },
      { href: "/agency/inbox", label: "Inbox", icon: MessageSquare },
    ],
  },
  {
    label: "Dashboards",
    items: [
      { href: "/agency/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/agency/studio", label: "Studio", icon: Terminal },
      { href: "/agency/finance", label: "Finance", icon: Wallet },
      { href: "/agency/intelligence", label: "Intelligence", icon: Brain },
    ],
  },
  {
    label: "Gestão",
    items: [{ href: "/agency/team", label: "Time", icon: UsersRound }],
  },
];

export function AgencyShell({
  userName,
  userType,
  children,
}: {
  userName: string;
  userType: UserType;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => setOpen(false), [pathname]);

  const nav = (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4" aria-label="Navegação da agência">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="microlabel mb-1.5 px-2.5">{group.label}</p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-md border-l-2 px-2.5 py-1.5 text-[13px] transition-colors",
                      active
                        ? "border-neon bg-surface-3 font-medium text-ink"
                        : "border-transparent text-ink-mute hover:bg-surface-3/60 hover:text-ink",
                    )}
                  >
                    <item.icon className={cn("size-4", active ? "text-neon" : "text-ink-faint group-hover:text-ink-mute")} aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const userBox = (
    <div className="border-t border-line px-3 py-3">
      <div className="flex items-center gap-2.5">
        <Avatar name={userName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-ink">{userName}</p>
          <p className="text-[10px] text-ink-faint">{USER_TYPE[userType]}</p>
        </div>
        <form action={signOutAction}>
          <button type="submit" className="rounded-sm px-1.5 py-1 text-[11px] text-ink-faint transition-colors hover:bg-surface-3 hover:text-ink">
            Sair
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      {/* sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-line bg-surface-1 lg:flex">
        <div className="border-b border-line px-4 py-3.5">
          <Link href="/agency/dashboard" aria-label="Dashboard">
            <Logo />
          </Link>
        </div>
        {nav}
        {userBox}
      </aside>

      {/* topbar mobile */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-12 items-center justify-between border-b border-line glass px-4 lg:hidden">
        <Link href="/agency/dashboard" aria-label="Dashboard">
          <Logo compact />
        </Link>
        <button
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-1.5 text-ink-mute hover:bg-surface-3 hover:text-ink"
        >
          {open ? <X className="size-5" /> : <MenuIcon className="size-5" />}
        </button>
      </div>
      {open ? (
        <div className="fixed inset-0 z-20 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-line bg-surface-1 pt-12 animate-fade">
            {nav}
            {userBox}
          </div>
        </div>
      ) : null}

      <main className="min-w-0 flex-1 px-4 pb-16 pt-16 lg:ml-56 lg:px-8 lg:pt-8">{children}</main>
    </div>
  );
}
