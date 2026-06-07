"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { Client, CreativeApproval } from "@/lib/types";

const STAGE_LABEL: Record<string, string> = {
  active:   "Ativo",
  prospect: "Prospect",
  at_risk:  "Em risco",
  paused:   "Pausado",
  churned:  "Churn",
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
  const [approvals, setApprovals] = useState<CreativeApproval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Client[]>("/api/agency/clients"),
      api.get<CreativeApproval[]>("/api/agency/approvals?status=pending"),
    ])
      .then(([c, a]) => { setClients(c); setApprovals(a); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const active = clients.filter((c) => !["churned"].includes(c.stage));
  const mrr = clients
    .filter((c) => c.stage !== "churned")
    .reduce((s, c) => s + (c.plan_value ?? 0), 0);
  const atRisk = clients.filter((c) => c.stage === "at_risk");


  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Visão geral da agência</p>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR — hero card */}
        <div className="bg-violet-950 border border-violet-800/50 rounded-xl px-5 py-5 lg:col-span-1">
          <p className="text-xs text-violet-400 uppercase tracking-widest font-medium">MRR</p>
          <p className="text-3xl font-bold text-violet-200 mt-2">{fmt(mrr, "R$ ")}</p>
          <p className="text-xs text-violet-600 mt-1">receita mensal</p>
        </div>

        {/* Clientes ativos */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-5">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Ativos</p>
          <p className="text-2xl font-bold text-white mt-2">{active.length}</p>
          <p className="text-xs text-zinc-600 mt-1">clientes</p>
        </div>

        {/* Total clientes */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-5">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Total</p>
          <p className="text-2xl font-bold text-white mt-2">{clients.length}</p>
          <p className="text-xs text-zinc-600 mt-1">cadastrados</p>
        </div>

        {/* Aprovações pendentes */}
        <div className={`border rounded-xl px-5 py-5 ${
          approvals.length > 0
            ? "bg-amber-950/30 border-amber-700/40"
            : "bg-zinc-900 border-zinc-800"
        }`}>
          <p className={`text-xs uppercase tracking-widest font-medium ${
            approvals.length > 0 ? "text-amber-500" : "text-zinc-500"
          }`}>Pendentes</p>
          <p className={`text-2xl font-bold mt-2 ${
            approvals.length > 0 ? "text-amber-400" : "text-white"
          }`}>{approvals.length}</p>
          <p className={`text-xs mt-1 ${
            approvals.length > 0 ? "text-amber-700" : "text-zinc-600"
          }`}>aprovações</p>
        </div>
      </div>

      {/* Ações pendentes */}
      {(atRisk.length > 0 || approvals.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {atRisk.length > 0 && (
            <div className="bg-zinc-900 border border-amber-500/20 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-amber-400" aria-hidden="true" />
                <h2 className="text-sm font-medium text-amber-400">Clientes em risco</h2>
              </div>
              <div className="space-y-1">
                {atRisk.map((c) => (
                  <Link
                    key={c.id}
                    href={`/agency/clients/${c.id}`}
                    className="flex items-center justify-between rounded px-2 py-2 hover:bg-zinc-800 transition-colors"
                  >
                    <div>
                      <p className="text-sm text-white">{c.brand}</p>
                      <p className="text-xs text-zinc-500">{c.name}</p>
                    </div>
                    <span className="text-xs text-amber-400">Ver →</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {approvals.length > 0 && (
            <div className="bg-zinc-900 border border-violet-500/20 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-violet-400" aria-hidden="true" />
                <h2 className="text-sm font-medium text-violet-400">Criativos aguardando aprovação</h2>
              </div>
              <div className="space-y-1">
                {approvals.slice(0, 5).map((a) => (
                  <Link
                    key={a.id}
                    href="/agency/approvals"
                    className="flex items-center justify-between rounded px-2 py-2 hover:bg-zinc-800 transition-colors"
                  >
                    <div>
                      <p className="text-sm text-white">{a.title}</p>
                      <p className="text-xs text-zinc-500">{a.brand ?? a.client_name}</p>
                    </div>
                    <span className="text-xs text-zinc-500">Ver →</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
