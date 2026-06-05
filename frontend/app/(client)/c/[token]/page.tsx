"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Metrics {
  total_spend: number;
  avg_roas: number;
  avg_cpa: number;
  total_impressions: number;
  total_clicks: number;
}

interface Notif {
  id: number;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

function fmt(n: number, prefix = "") {
  return `${prefix}${n.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`;
}

export default function ClientHomePage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [notifs, setNotifs] = useState<Notif[]>([]);

  useEffect(() => {
    api.get<Metrics>("/api/client/metrics?days=30").then(setMetrics);
    api.get<Notif[]>("/api/client/notifications?unread_only=false").then(setNotifs);
  }, []);

  const cards = metrics
    ? [
        { label: "Investimento (30d)", value: fmt(metrics.total_spend, "R$ ") },
        { label: "ROAS médio",         value: `${metrics.avg_roas.toFixed(2)}x` },
        { label: "CPA médio",          value: metrics.avg_cpa ? fmt(metrics.avg_cpa, "R$ ") : "—" },
        { label: "Impressões",         value: fmt(metrics.total_impressions) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Resumo</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Últimos 30 dias</p>
      </div>

      {/* KPI cards */}
      {metrics ? (
        <div className="grid grid-cols-2 gap-3">
          {cards.map((c) => (
            <div key={c.label} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
              <p className="text-xs text-zinc-500">{c.label}</p>
              <p className="text-xl font-bold text-white mt-1">{c.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 animate-pulse h-16" />
          ))}
        </div>
      )}

      {/* Notifications */}
      {notifs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-white">Avisos</h2>
          {notifs.slice(0, 5).map((n) => (
            <div
              key={n.id}
              className={`bg-zinc-900 border rounded-lg px-4 py-3 ${
                n.read_at ? "border-zinc-800" : "border-violet-700"
              }`}
            >
              <div className="flex items-start gap-2">
                {!n.read_at && (
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">{n.title}</p>
                  {n.body && <p className="text-xs text-zinc-400 mt-0.5">{n.body}</p>}
                  <p className="text-xs text-zinc-600 mt-1">
                    {new Date(n.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
