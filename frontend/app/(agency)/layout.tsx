"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const NAV = [
  { href: "/agency/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/agency/clients",   label: "Clientes",  icon: "◎" },
  { href: "/agency/approvals", label: "Aprovações", icon: "✓" },
];

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    api.get<{ name: string; role: string }>("/api/auth/me")
      .then(setUser)
      .catch(() => router.push("/login"));
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
        <div className="px-5 py-5 border-b border-zinc-800">
          <span className="font-bold text-lg tracking-tight text-white">Perseo</span>
          <p className="text-xs text-zinc-500 mt-0.5">Agency Dashboard</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-violet-600 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-400 truncate mb-2">{user.name}</p>
          <button
            onClick={logout}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
