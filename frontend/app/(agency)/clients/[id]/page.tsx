"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Client, CreativeApproval, ChatMessage } from "@/lib/types";

export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [approvals, setApprovals] = useState<CreativeApproval[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [portalToken, setPortalToken] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "criativos" | "chat">("overview");

  useEffect(() => {
    api.get<Client>(`/api/agency/clients/${id}`).then(setClient);
    api.get<CreativeApproval[]>(`/api/agency/approvals?status=pending`).then((all) =>
      setApprovals(all.filter((a) => a.client_id === Number(id)))
    );
    api.get<ChatMessage[]>(`/api/agency/chat/${id}/messages`).then(setMessages);
    api.get<{ token: string }>(`/api/agency/clients/${id}/portal-token`).then((r) =>
      setPortalToken(r.token)
    );
  }, [id]);

  async function sendMessage() {
    if (!chatInput.trim()) return;
    await api.post(`/api/agency/chat/${id}/messages`, {
      content: chatInput,
      sender_name: "Perseo",
    });
    setChatInput("");
    api.get<ChatMessage[]>(`/api/agency/chat/${id}/messages`).then(setMessages);
  }

  if (!client) return (
    <div className="p-8 text-zinc-500 text-sm">Carregando...</div>
  );

  const portalUrl = portalToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/c/${portalToken}`
    : null;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">{client.brand}</h1>
          <p className="text-zinc-400 text-sm">{client.name} · {client.niche}</p>
        </div>
        {portalUrl && (
          <div className="text-right">
            <p className="text-xs text-zinc-500 mb-1">Link do cliente</p>
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-400 hover:underline break-all"
            >
              {portalUrl}
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(portalUrl)}
              className="ml-2 text-xs text-zinc-500 hover:text-zinc-300"
            >
              Copiar
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-0">
        {(["overview", "criativos", "chat"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm -mb-px border-b-2 transition-colors ${
              tab === t
                ? "border-violet-500 text-violet-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t === "overview" ? "Visão geral" : t === "criativos" ? "Criativos" : "Chat"}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Budget mensal", value: client.monthly_budget ? `R$ ${client.monthly_budget.toLocaleString("pt-BR")}` : "—" },
            { label: "ROAS atual",    value: client.current_roas ? `${client.current_roas.toFixed(2)}x` : "—" },
            { label: "CPA atual",     value: client.current_cpa ? `R$ ${client.current_cpa.toFixed(2)}` : "—" },
            { label: "Plano",         value: client.plan_value ? `R$ ${client.plan_value.toLocaleString("pt-BR")}` : client.plan },
          ].map((m) => (
            <div key={m.label} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
              <p className="text-xs text-zinc-500">{m.label}</p>
              <p className="text-lg font-semibold text-white mt-0.5">{m.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Criativos */}
      {tab === "criativos" && (
        <div className="space-y-3">
          {approvals.length === 0 ? (
            <p className="text-zinc-500 text-sm">Nenhum criativo pendente.</p>
          ) : (
            approvals.map((a) => (
              <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex gap-4">
                {a.thumbnail_url && (
                  <img src={a.thumbnail_url} alt="" className="w-20 h-20 rounded object-cover bg-zinc-800" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{a.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{a.description}</p>
                  {a.media_url && (
                    <a href={a.media_url} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-violet-400 hover:underline mt-1 block">
                      Ver mídia →
                    </a>
                  )}
                </div>
                <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 h-fit rounded-full">
                  Aguardando
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Chat */}
      {tab === "chat" && (
        <div className="flex flex-col gap-3" style={{ height: "60vh" }}>
          <div className="flex-1 overflow-y-auto space-y-2 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            {messages.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center mt-8">Sem mensagens ainda</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender_type === "agency" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    m.sender_type === "agency"
                      ? "bg-violet-600 text-white"
                      : "bg-zinc-800 text-zinc-200"
                  }`}>
                    <p>{m.content}</p>
                    <p className="text-xs opacity-50 mt-0.5">
                      {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Digite uma mensagem..."
              className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-white focus:outline-none focus:border-violet-500"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-md transition-colors"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
