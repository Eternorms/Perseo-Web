"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Client } from "@/lib/types";

const STAGE_LABEL: Record<string, string> = {
  active: "Ativo",
  prospect: "Prospect",
  at_risk: "Em risco",
  paused: "Pausado",
  churned: "Churn",
};

const STAGE_COLOR: Record<string, string> = {
  active:   "bg-emerald-500/20 text-emerald-400",
  prospect: "bg-blue-500/20 text-blue-400",
  at_risk:  "bg-amber-500/20 text-amber-400",
  paused:   "bg-zinc-500/20 text-zinc-400",
  churned:  "bg-red-500/20 text-red-400",
};

function fmt(n: number, prefix = "") {
  return `${prefix}${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Client[]>("/api/agency/clients")
      .then(setClients)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const active = clients.filter((c) => c.stage === "active");
  const mrr = clients
    .filter((c) => ["active", "at_risk"].includes(c.stage))
    .reduce((s, c) => s + (c.plan_value ?? 0), 0);

  const kpis = [
    { label: "Clientes ativos",  value: String(active.length) },
    { label: "MRR",              value: fmt(mrr, "R$ ") },
    { label: "Total clientes",   value: String(clients.length) },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Visão geral da agência</p>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">{k.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Clients table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Clientes</h2>
          <span className="text-xs text-zinc-500">{clients.length} total</span>
        </div>

        {loading ? (
          <div className="px-5 py-8 text-center text-zinc-500 text-sm">Carregando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Marca", "Nicho", "Plano", "MRR", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-zinc-500 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/agency/clients/${c.id}`}
                      className="text-violet-400 hover:text-violet-300 font-medium"
                    >
                      {c.brand}
                    </Link>
                    <p className="text-xs text-zinc-500">{c.name}</p>
                  </td>
                  <td className="px-5 py-3 text-zinc-400">{c.niche}</td>
                  <td className="px-5 py-3 text-zinc-400">{c.plan}</td>
                  <td className="px-5 py-3 text-zinc-300">
                    {c.plan_value ? fmt(c.plan_value, "R$ ") : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        STAGE_COLOR[c.stage] ?? "bg-zinc-700 text-zinc-300"
                      }`}
                    >
                      {STAGE_LABEL[c.stage] ?? c.stage}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
