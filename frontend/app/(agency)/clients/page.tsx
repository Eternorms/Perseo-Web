"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Client } from "@/lib/types";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Client[]>("/api/agency/clients")
      .then(setClients)
      .finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter(
    (c) =>
      c.brand.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.niche.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Clientes</h1>
          <p className="text-zinc-400 text-sm mt-1">{clients.length} clientes cadastrados</p>
        </div>
        <input
          type="text"
          placeholder="Buscar marca, nome, nicho..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-white w-64 focus:outline-none focus:border-violet-500"
        />
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/agency/clients/${c.id}`}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{c.brand}</h3>
                  <p className="text-xs text-zinc-500">{c.name}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  c.stage === "active" ? "bg-emerald-500/20 text-emerald-400" :
                  c.stage === "at_risk" ? "bg-amber-500/20 text-amber-400" :
                  "bg-zinc-700 text-zinc-400"
                }`}>
                  {c.stage}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-zinc-500">Nicho</p>
                  <p className="text-zinc-300">{c.niche}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Plano</p>
                  <p className="text-zinc-300">{c.plan_value ? `R$ ${c.plan_value}` : c.plan}</p>
                </div>
                {c.current_roas && (
                  <div>
                    <p className="text-zinc-500">ROAS</p>
                    <p className="text-emerald-400 font-medium">{c.current_roas.toFixed(2)}x</p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
