"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, CheckSquare, LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { CreativeApproval } from "@/lib/types";

const NAV = [
  { href: "/agency/dashboard", label: "Dashboard",  Icon: LayoutDashboard },
  { href: "/agency/clients",   label: "Clientes",   Icon: Users },
  { href: "/agency/approvals", label: "Aprovações", Icon: CheckSquare },
];

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    api.get<{ name: string; role: string }>("/api/auth/me")
      .then(setUser)
      .catch(() => router.push("/login"));
    api.get<CreativeApproval[]>("/api/agency/approvals?status=pending")
      .then((a) => setPendingCount(a.length))
      .catch(() => {});
  }, [router]);

  async function logout() {
    await api.post("/api/auth/logout");
    router.push("/login");
  }

  if (!user) return (
    <div className="flex items-center justify-center h-screen bg-zinc-950 text-zinc-400">
      Carregando...
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="px-4 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-violet-900/60">
              <span className="text-white font-bold text-sm select-none">P</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-white leading-none">Perseo</p>
              <p className="text-xs text-zinc-500 leading-none mt-0.5">Agency</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Navegação principal">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname?.startsWith(href);
            const showBadge = href === "/agency/approvals" && pendingCount > 0;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-violet-600 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                <span className="flex-1">{label}</span>
                {showBadge && (
                  <span className="bg-amber-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full leading-none min-w-[18px] text-center">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-zinc-800">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-full bg-violet-600/20 border border-violet-600/30 flex items-center justify-center shrink-0">
              <span className="text-violet-400 text-xs font-semibold select-none">
                {(user.name ?? "A").charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-zinc-300 truncate flex-1">{user.name ?? "Admin"}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <LogOut size={13} aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
