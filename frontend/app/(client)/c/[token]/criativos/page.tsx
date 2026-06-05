"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CreativeApproval } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  pending:  "Aguardando sua resposta",
  approved: "Aprovado",
  rejected: "Rejeitado",
  revision: "Revisão solicitada",
};

const STATUS_COLOR: Record<string, string> = {
  pending:  "border-amber-700 bg-amber-950/30",
  approved: "border-emerald-700 bg-emerald-950/30",
  rejected: "border-red-700 bg-red-950/30",
  revision: "border-blue-700 bg-blue-950/30",
};

export default function CriativosPage() {
  const [approvals, setApprovals] = useState<CreativeApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);

  function load() {
    api.get<CreativeApproval[]>("/api/client/approvals")
      .then(setApprovals)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function decide(id: number, status: "approved" | "rejected" | "revision") {
    setSubmitting(id);
    try {
      await api.patch(`/api/client/approvals/${id}`, {
        status,
        feedback: feedback[id] ?? null,
      });
      load();
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) return <p className="text-zinc-500 text-sm">Carregando...</p>;

  const pending = approvals.filter((a) => a.status === "pending");
  const decided = approvals.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Criativos</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Revise e aprove os criativos da sua campanha</p>
      </div>

      {pending.length === 0 && decided.length === 0 && (
        <p className="text-zinc-500 text-sm">Nenhum criativo disponível ainda.</p>
      )}

      {/* Pending */}
      {pending.map((a) => (
        <div key={a.id} className={`border rounded-xl overflow-hidden ${STATUS_COLOR[a.status]}`}>
          {a.thumbnail_url && (
            <img src={a.thumbnail_url} alt={a.title} className="w-full h-48 object-cover bg-zinc-800" />
          )}
          <div className="p-4 space-y-3">
            <h3 className="font-semibold text-white">{a.title}</h3>
            {a.description && <p className="text-sm text-zinc-400">{a.description}</p>}
            {a.media_url && (
              <a href={a.media_url} target="_blank" rel="noopener noreferrer"
                 className="block text-sm text-violet-400 hover:underline">
                Visualizar criativo →
              </a>
            )}

            <textarea
              value={feedback[a.id] ?? ""}
              onChange={(e) => setFeedback((f) => ({ ...f, [a.id]: e.target.value }))}
              placeholder="Deixe um comentário (opcional para aprovar, recomendado para revisão/rejeição)"
              rows={2}
              className="w-full px-3 py-2 bg-zinc-950/50 border border-zinc-700 rounded-lg text-sm text-white resize-none focus:outline-none focus:border-violet-500"
            />

            <div className="flex gap-2">
              <button
                onClick={() => decide(a.id, "approved")}
                disabled={submitting === a.id}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Aprovar
              </button>
              <button
                onClick={() => decide(a.id, "revision")}
                disabled={submitting === a.id}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Pedir ajuste
              </button>
              <button
                onClick={() => decide(a.id, "rejected")}
                disabled={submitting === a.id}
                className="py-2.5 px-4 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-zinc-300 text-sm rounded-lg transition-colors"
              >
                Rejeitar
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Already decided */}
      {decided.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-500">Anteriores</h2>
          {decided.map((a) => (
            <div key={a.id} className={`border rounded-lg p-3 flex items-center gap-3 ${STATUS_COLOR[a.status]}`}>
              {a.thumbnail_url && (
                <img src={a.thumbnail_url} alt="" className="w-12 h-12 rounded object-cover bg-zinc-800 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{a.title}</p>
                <p className="text-xs text-zinc-500">{STATUS_LABEL[a.status]}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
