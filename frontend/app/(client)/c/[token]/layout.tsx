"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ClientPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    // Autentica e obtém info do cliente
    fetch(`${BASE}/api/client/auth?token=${token}`, {
      method: "POST",
      credentials: "include",
    }).then(async (res) => {
      if (!res.ok) {
        router.push("/login");
        return;
      }
      // Carrega nome do cliente
      fetch(`${BASE}/api/client/me`, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
          setClientName(data.brand ?? data.name ?? "");
          setReady(true);
        });
    });
  }, [token, router]);

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
      Carregando portal...
    </div>
  );

  const base = `/c/${token}`;

  const NAV = [
    { href: base,               label: "Início",      icon: "⊞" },
    { href: `${base}/criativos`, label: "Criativos",   icon: "▶" },
    { href: `${base}/chat`,      label: "Falar com agência", icon: "💬" },
    { href: `${base}/materiais`, label: "Enviar material",   icon: "↑" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Mobile header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div>
          <span className="font-semibold text-white text-sm">Perseo Agency</span>
          {clientName && <span className="text-zinc-400 text-xs ml-2">· {clientName}</span>}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">{children}</div>

      {/* Bottom nav (mobile-friendly) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-4 py-2 flex justify-around">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 text-zinc-500 hover:text-zinc-100 transition-colors py-1 px-2"
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom nav spacer */}
      <div className="h-20" />
    </div>
  );
}
