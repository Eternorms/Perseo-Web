"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CreativeApproval } from "@/lib/types";

const STATUS_COLOR: Record<string, string> = {
  pending:  "bg-amber-500/20 text-amber-400",
  approved: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red-500/20 text-red-400",
  revision: "bg-blue-500/20 text-blue-400",
};

const STATUS_LABEL: Record<string, string> = {
  pending:  "Aguardando",
  approved: "Aprovado",
  rejected: "Rejeitado",
  revision: "Revisão",
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<CreativeApproval[]>([]);
  const [tab, setTab] = useState<string>("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<CreativeApproval[]>(`/api/agency/approvals?status=${tab}`)
      .then(setApprovals)
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Aprovações</h1>
        <p className="text-zinc-400 text-sm mt-1">Criativos enviados para revisão do cliente</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {["pending", "approved", "rejected", "revision"].map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              tab === s
                ? "bg-violet-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm">Carregando...</p>
      ) : approvals.length === 0 ? (
        <p className="text-zinc-500 text-sm">Nenhum criativo com este status.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {approvals.map((a) => (
            <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              {a.thumbnail_url ? (
                <img
                  src={a.thumbnail_url}
                  alt={a.title}
                  className="w-full h-40 object-cover bg-zinc-800"
                />
              ) : (
                <div className="w-full h-40 bg-zinc-800 flex items-center justify-center text-zinc-600 text-sm">
                  Sem thumbnail
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium text-white leading-tight">{a.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[a.status]}`}>
                    {STATUS_LABEL[a.status]}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">{a.brand ?? a.client_name}</p>
                {a.client_feedback && (
                  <p className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1.5 rounded">
                    "{a.client_feedback}"
                  </p>
                )}
                {a.media_url && (
                  <a
                    href={a.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-violet-400 hover:underline"
                  >
                    Ver mídia →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
