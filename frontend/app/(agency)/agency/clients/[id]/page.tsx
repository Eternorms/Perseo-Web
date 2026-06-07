"use client";

import { use, useEffect, useState } from "react";
import { Copy, ExternalLink, Pencil, X, Check } from "lucide-react";
import { api } from "@/lib/api";
import { Client, CreativeApproval, ChatMessage } from "@/lib/types";

const STAGE_OPTIONS = [
  { value: "prospect", label: "Prospect" },
  { value: "active",   label: "Ativo" },
  { value: "at_risk",  label: "Em risco" },
  { value: "paused",   label: "Pausado" },
  { value: "churned",  label: "Churn" },
];

export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [approvals, setApprovals] = useState<CreativeApproval[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [portalToken, setPortalToken] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "criativos" | "chat">("overview");

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Client>>({});
  const [saving, setSaving] = useState(false);

  // Creative form state
  const [showNewCreative, setShowNewCreative] = useState(false);
  const [creativeForm, setCreativeForm] = useState({ title: "", description: "", media_url: "", thumbnail_url: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<Client>(`/api/agency/clients/${id}`).then((c) => {
      setClient(c);
      setEditForm(c);
    });
    api.get<CreativeApproval[]>(`/api/agency/approvals?status=pending`).then((all) =>
      setApprovals(all.filter((a) => a.client_id === Number(id)))
    );
    api.get<ChatMessage[]>(`/api/agency/chat/${id}/messages`).then(setMessages);
    api.get<{ token: string }>(`/api/agency/clients/${id}/portal-token`).then((r) =>
      setPortalToken(r.token)
    );
  }, [id]);

  function loadApprovals() {
    api.get<CreativeApproval[]>(`/api/agency/approvals?status=pending`).then((all) =>
      setApprovals(all.filter((a) => a.client_id === Number(id)))
    );
  }

  async function saveEdit() {
    setSaving(true);
    try {
      await api.patch(`/api/agency/clients/${id}`, editForm);
      const updated = await api.get<Client>(`/api/agency/clients/${id}`);
      setClient(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function submitCreative() {
    if (!creativeForm.title || !creativeForm.media_url) return;
    setSubmitting(true);
    try {
      await api.post(`/api/agency/approvals`, {
        client_id: Number(id),
        title: creativeForm.title,
        description: creativeForm.description || null,
        media_url: creativeForm.media_url,
        thumbnail_url: creativeForm.thumbnail_url || null,
      });
      setCreativeForm({ title: "", description: "", media_url: "", thumbnail_url: "" });
      setShowNewCreative(false);
      loadApprovals();
    } finally {
      setSubmitting(false);
    }
  }

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

  const inputCls = "w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all";

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">{client.brand}</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{client.name} · {client.niche}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Edit toggle */}
          {!editing ? (
            <button
              onClick={() => { setEditing(true); setEditForm(client); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-xs rounded-lg transition-colors"
            >
              <Pencil size={12} aria-hidden="true" />
              Editar
            </button>
          ) : (
            <>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 text-xs rounded-lg transition-colors"
              >
                <X size={12} aria-hidden="true" />
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors"
              >
                <Check size={12} aria-hidden="true" />
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </>
          )}

          {/* Portal buttons */}
          {portalUrl && (
            <>
              <button
                onClick={() => navigator.clipboard.writeText(portalUrl)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-xs rounded-lg transition-colors"
                aria-label="Copiar link do portal do cliente"
              >
                <Copy size={12} aria-hidden="true" />
                Copiar link
              </button>
              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-xs rounded-lg transition-colors"
                aria-label="Abrir portal do cliente em nova aba"
              >
                <ExternalLink size={12} aria-hidden="true" />
                Abrir portal
              </a>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Seções do cliente" className="flex gap-2 border-b border-zinc-800">
        {(["overview", "criativos", "chat"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
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
        <div role="tabpanel">
          {editing ? (
            /* Edit form */
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <p className="text-sm font-medium text-white mb-2">Editar cliente</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Nome completo</label>
                  <input value={editForm.name ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Marca</label>
                  <input value={editForm.brand ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, brand: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Nicho</label>
                  <input value={editForm.niche ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, niche: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Status</label>
                  <select
                    value={editForm.stage ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, stage: e.target.value }))}
                    className={inputCls}
                  >
                    {STAGE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Plano</label>
                  <input value={editForm.plan ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, plan: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Mensalidade (R$)</label>
                  <input type="number" value={editForm.plan_value ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, plan_value: Number(e.target.value) }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Verba de tráfego (R$)</label>
                  <input type="number" value={editForm.monthly_budget ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, monthly_budget: Number(e.target.value) }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">E-mail</label>
                  <input type="email" value={editForm.client_email ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, client_email: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">WhatsApp</label>
                  <input value={editForm.client_whatsapp ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, client_whatsapp: e.target.value }))} className={inputCls} placeholder="+55..." />
                </div>
              </div>
            </div>
          ) : (
            /* Read-only KPIs */
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Budget mensal", value: client.monthly_budget ? `R$ ${client.monthly_budget.toLocaleString("pt-BR")}` : "—" },
                { label: "ROAS atual",    value: client.current_roas ? `${client.current_roas.toFixed(2)}x` : "—" },
                { label: "CPA atual",     value: client.current_cpa ? `R$ ${client.current_cpa.toFixed(2)}` : "—" },
                { label: "Plano",         value: client.plan_value ? `R$ ${client.plan_value.toLocaleString("pt-BR")}` : client.plan },
              ].map((m) => (
                <div key={m.label} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">{m.label}</p>
                  <p className="text-lg font-semibold text-white mt-1.5">{m.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Criativos */}
      {tab === "criativos" && (
        <div role="tabpanel" className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowNewCreative((v) => !v)}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg transition-colors"
            >
              + Enviar criativo
            </button>
          </div>

          {showNewCreative && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 space-y-3">
              <p className="text-sm font-medium text-white">Novo criativo para aprovação</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 block mb-1">Título *</label>
                  <input
                    value={creativeForm.title}
                    onChange={(e) => setCreativeForm((f) => ({ ...f, title: e.target.value }))}
                    className={inputCls}
                    placeholder="Ex: Anúncio UGC - Produto X"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 block mb-1">URL da mídia *</label>
                  <input
                    value={creativeForm.media_url}
                    onChange={(e) => setCreativeForm((f) => ({ ...f, media_url: e.target.value }))}
                    className={inputCls}
                    placeholder="https://drive.google.com/..."
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Descrição</label>
                  <input
                    value={creativeForm.description}
                    onChange={(e) => setCreativeForm((f) => ({ ...f, description: e.target.value }))}
                    className={inputCls}
                    placeholder="Contexto do criativo"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">URL da thumbnail</label>
                  <input
                    value={creativeForm.thumbnail_url}
                    onChange={(e) => setCreativeForm((f) => ({ ...f, thumbnail_url: e.target.value }))}
                    className={inputCls}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowNewCreative(false)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={submitCreative}
                  disabled={submitting || !creativeForm.title || !creativeForm.media_url}
                  className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors"
                >
                  {submitting ? "Enviando..." : "Enviar para aprovação"}
                </button>
              </div>
            </div>
          )}

          {approvals.length === 0 ? (
            <p className="text-zinc-500 text-sm">Nenhum criativo pendente.</p>
          ) : (
            approvals.map((a) => (
              <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-4">
                {a.thumbnail_url && (
                  <img src={a.thumbnail_url} alt="" className="w-20 h-20 rounded-lg object-cover bg-zinc-800 shrink-0" />
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
                <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 h-fit rounded-full shrink-0">
                  Aguardando
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Chat */}
      {tab === "chat" && (
        <div role="tabpanel" className="flex flex-col gap-3" style={{ height: "60vh" }}>
          <div className="flex-1 overflow-y-auto space-y-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            {messages.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center mt-8">Sem mensagens ainda</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender_type === "agency" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
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
              className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-xl transition-colors"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
