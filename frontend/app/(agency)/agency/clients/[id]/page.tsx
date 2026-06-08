"use client";

import { use, useEffect, useState, useCallback } from "react";
import { Copy, ExternalLink, Pencil, X, Check, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Client, CreativeApproval, ChatMessage, Task, FunnelStage } from "@/lib/types";

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  blue:    { bg: "bg-blue-500",    text: "text-blue-400",    border: "border-blue-500/20" },
  emerald: { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/20" },
  amber:   { bg: "bg-amber-500",   text: "text-amber-400",   border: "border-amber-500/20" },
  zinc:    { bg: "bg-zinc-500",    text: "text-zinc-400",    border: "border-zinc-500/20" },
  red:     { bg: "bg-red-500",     text: "text-red-400",     border: "border-red-500/20" },
  violet:  { bg: "bg-violet-500",  text: "text-violet-400",  border: "border-violet-500/20" },
  pink:    { bg: "bg-pink-500",    text: "text-pink-400",    border: "border-pink-500/20" },
  cyan:    { bg: "bg-cyan-500",    text: "text-cyan-400",    border: "border-cyan-500/20" },
};
const PALETTE = Object.keys(COLOR_MAP);

const KANBAN_COLS = [
  { key: "pending",  label: "Aguardando", border: "border-amber-500/20",   text: "text-amber-400" },
  { key: "approved", label: "Aprovado",   border: "border-emerald-500/20", text: "text-emerald-400" },
  { key: "revision", label: "Revisão",    border: "border-blue-500/20",    text: "text-blue-400" },
  { key: "rejected", label: "Rejeitado",  border: "border-red-500/20",     text: "text-red-400" },
];

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500", medium: "bg-amber-500", low: "bg-zinc-500",
};

export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [approvals, setApprovals] = useState<CreativeApproval[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [clientTasks, setClientTasks] = useState<Task[]>([]);
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [portalToken, setPortalToken] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "criativos" | "chat" | "funil">("overview");

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Client>>({});
  const [saving, setSaving] = useState(false);

  const [showNewCreative, setShowNewCreative] = useState(false);
  const [creativeForm, setCreativeForm] = useState({ title: "", description: "", media_url: "", thumbnail_url: "" });
  const [submitting, setSubmitting] = useState(false);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", priority: "medium", due_date: "" });
  const [creatingTask, setCreatingTask] = useState(false);
  const [movingStage, setMovingStage] = useState(false);

  const [editingFunnel, setEditingFunnel] = useState(false);
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStageForm, setNewStageForm] = useState({ label: "", color: "zinc" });
  const [addingStage, setAddingStage] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function loadApprovals() {
    api.get<CreativeApproval[]>(`/api/agency/approvals?client_id=${id}`)
      .then(setApprovals)
      .catch(console.error);
  }

  function loadMessages() {
    api.get<ChatMessage[]>(`/api/agency/chat/${id}/messages`)
      .then(setMessages)
      .catch(console.error);
  }

  const loadClientTasks = useCallback(() => {
    api.get<Task[]>(`/api/agency/tasks?client_id=${id}`)
      .then((all) => setClientTasks(all.filter((t) => t.status !== "done")))
      .catch(console.error);
  }, [id]);

  const loadFunnelStages = useCallback(() => {
    api.get<FunnelStage[]>(`/api/agency/clients/${id}/funnel-stages`)
      .then(setFunnelStages)
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    api.get<Client>(`/api/agency/clients/${id}`).then((c) => {
      setClient(c);
      setEditForm(c);
    });
    loadApprovals();
    loadMessages();
    loadClientTasks();
    loadFunnelStages();
    api.get<{ token: string }>(`/api/agency/clients/${id}/portal-token`).then((r) =>
      setPortalToken(r.token)
    );
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab !== "chat") return;
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [tab, id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab === "funil") {
      loadClientTasks();
      loadFunnelStages();
    }
  }, [tab, loadClientTasks, loadFunnelStages]);

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
    loadMessages();
  }

  async function moveToStage(stage: string) {
    if (!client || movingStage) return;
    setMovingStage(true);
    try {
      await api.patch(`/api/agency/clients/${id}`, { stage });
      setClient((prev) => prev ? { ...prev, stage } : prev);
    } finally {
      setMovingStage(false);
    }
  }

  async function createClientTask() {
    if (!taskForm.title.trim()) return;
    setCreatingTask(true);
    try {
      await api.post("/api/agency/tasks", {
        title: taskForm.title,
        priority: taskForm.priority,
        due_date: taskForm.due_date || null,
        client_id: Number(id),
      });
      setTaskForm({ title: "", priority: "medium", due_date: "" });
      setShowTaskForm(false);
      loadClientTasks();
    } finally {
      setCreatingTask(false);
    }
  }

  async function completeTask(taskId: number) {
    await api.patch(`/api/agency/tasks/${taskId}`, { status: "done" });
    setClientTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  async function addFunnelStage() {
    if (!newStageForm.label.trim()) return;
    setAddingStage(true);
    try {
      await api.post(`/api/agency/clients/${id}/funnel-stages`, {
        label: newStageForm.label,
        color: newStageForm.color,
      });
      setNewStageForm({ label: "", color: "zinc" });
      setShowAddStage(false);
      loadFunnelStages();
    } finally {
      setAddingStage(false);
    }
  }

  async function updateStageProp(stageId: number, updates: { label?: string; color?: string }) {
    await api.patch(`/api/agency/clients/${id}/funnel-stages/${stageId}`, updates);
    setFunnelStages((prev) =>
      prev.map((s) => (s.id === stageId ? { ...s, ...updates } : s))
    );
  }

  async function deleteFunnelStage(stageId: number) {
    setDeleteError(null);
    try {
      await api.delete(`/api/agency/clients/${id}/funnel-stages/${stageId}`);
      setFunnelStages((prev) => prev.filter((s) => s.id !== stageId));
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Erro ao excluir");
    }
  }

  if (!client) return (
    <div className="p-8 text-zinc-500 text-sm">Carregando...</div>
  );

  const portalUrl = portalToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/c/${portalToken}`
    : null;

  const inputCls = "w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all";

  const stageOptions = funnelStages.length > 0
    ? funnelStages
    : [
        { value: "prospect", label: "Prospect" },
        { value: "active",   label: "Ativo" },
        { value: "at_risk",  label: "Em risco" },
        { value: "paused",   label: "Pausado" },
        { value: "churned",  label: "Churn" },
      ];

  const currentStageIdx = funnelStages.findIndex((s) => s.value === client.stage);
  const nextStage = currentStageIdx >= 0 && currentStageIdx < funnelStages.length - 1
    ? funnelStages[currentStageIdx + 1]
    : null;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">{client.brand}</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{client.name} · {client.niche}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
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
        {(["overview", "funil", "criativos", "chat"] as const).map((t) => (
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
            {t === "overview" ? "Visão geral" :
             t === "funil"    ? "Funil" :
             t === "criativos" ? "Criativos" : "Chat"}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div role="tabpanel">
          {editing ? (
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
                  <select value={editForm.stage ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, stage: e.target.value }))} className={inputCls}>
                    {stageOptions.map((o) => (
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

      {/* Funil */}
      {tab === "funil" && (
        <div role="tabpanel" className="space-y-6">

          {/* Pipeline steps */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Estágio no pipeline</p>
              <button
                onClick={() => { setEditingFunnel((v) => !v); setDeleteError(null); setShowAddStage(false); }}
                className={`flex items-center gap-1 text-xs transition-colors ${editingFunnel ? "text-violet-400 hover:text-violet-300" : "text-zinc-500 hover:text-zinc-300"}`}
                aria-label="Editar etapas do funil"
              >
                <Pencil size={11} />
                {editingFunnel ? "Concluir edição" : "Editar etapas"}
              </button>
            </div>

            {!editingFunnel ? (
              <>
                <div className="flex items-center gap-1 mb-4">
                  {funnelStages.map((step, idx) => {
                    const isCurrent = step.value === client.stage;
                    const isPast = idx < currentStageIdx;
                    const c = COLOR_MAP[step.color] ?? COLOR_MAP.zinc;
                    return (
                      <div key={step.id} className="flex items-center flex-1 min-w-0">
                        <button
                          onClick={() => moveToStage(step.value)}
                          disabled={movingStage}
                          className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium text-center transition-all ${
                            isCurrent
                              ? `${c.bg} text-white shadow-lg scale-105`
                              : isPast
                              ? "bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700"
                              : "bg-zinc-800 text-zinc-600 hover:bg-zinc-700 hover:text-zinc-400"
                          }`}
                        >
                          {step.label}
                        </button>
                        {idx < funnelStages.length - 1 && (
                          <div className={`w-4 h-0.5 shrink-0 mx-0.5 ${isPast ? "bg-zinc-600" : "bg-zinc-800"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                {nextStage && (
                  <button
                    onClick={() => moveToStage(nextStage.value)}
                    disabled={movingStage}
                    className={`text-xs px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors ${(COLOR_MAP[nextStage.color] ?? COLOR_MAP.zinc).text} hover:border-zinc-500 hover:text-white`}
                  >
                    {movingStage ? "Movendo..." : `Mover para ${nextStage.label} →`}
                  </button>
                )}
              </>
            ) : (
              <div className="space-y-2">
                {funnelStages.map((step) => {
                  const c = COLOR_MAP[step.color] ?? COLOR_MAP.zinc;
                  const isCurrent = step.value === client.stage;
                  return (
                    <div key={step.id} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.bg}`} />
                      <input
                        defaultValue={step.label}
                        onBlur={(e) => {
                          const newLabel = e.target.value.trim();
                          if (newLabel && newLabel !== step.label) {
                            updateStageProp(step.id, { label: newLabel });
                          }
                        }}
                        className="flex-1 bg-transparent text-sm text-white focus:outline-none focus:border-b focus:border-zinc-600 min-w-0"
                      />
                      <div className="flex items-center gap-1">
                        {PALETTE.map((color) => (
                          <button
                            key={color}
                            onClick={() => updateStageProp(step.id, { color })}
                            className={`w-4 h-4 rounded-full ${COLOR_MAP[color].bg} transition-transform ${step.color === color ? "ring-2 ring-white ring-offset-1 ring-offset-zinc-800 scale-110" : "opacity-60 hover:opacity-100"}`}
                            aria-label={color}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => deleteFunnelStage(step.id)}
                        disabled={isCurrent}
                        title={isCurrent ? "Não é possível excluir a etapa atual" : "Excluir etapa"}
                        className="text-zinc-600 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ml-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}

                {deleteError && (
                  <p className="text-xs text-red-400 px-2">{deleteError}</p>
                )}

                {showAddStage ? (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50 border border-zinc-700">
                    <input
                      autoFocus
                      value={newStageForm.label}
                      onChange={(e) => setNewStageForm((f) => ({ ...f, label: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addFunnelStage()}
                      placeholder="Nome da etapa"
                      className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none min-w-0"
                    />
                    <div className="flex items-center gap-1">
                      {PALETTE.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewStageForm((f) => ({ ...f, color }))}
                          className={`w-4 h-4 rounded-full ${COLOR_MAP[color].bg} transition-transform ${newStageForm.color === color ? "ring-2 ring-white ring-offset-1 ring-offset-zinc-800 scale-110" : "opacity-60 hover:opacity-100"}`}
                          aria-label={color}
                        />
                      ))}
                    </div>
                    <button
                      onClick={addFunnelStage}
                      disabled={addingStage || !newStageForm.label.trim()}
                      className="text-emerald-400 hover:text-emerald-300 disabled:opacity-30 transition-colors"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => { setShowAddStage(false); setNewStageForm({ label: "", color: "zinc" }); }}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddStage(true)}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1.5 transition-colors"
                  >
                    <Plus size={12} />
                    Adicionar etapa
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Kanban de aprovações */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Criativos</p>
              <button
                onClick={() => setShowNewCreative((v) => !v)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <Plus size={12} />
                Enviar criativo
              </button>
            </div>

            {showNewCreative && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-zinc-400 block mb-1">Título *</label>
                    <input value={creativeForm.title} onChange={(e) => setCreativeForm((f) => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="Ex: Anúncio UGC - Produto X" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-zinc-400 block mb-1">URL da mídia *</label>
                    <input value={creativeForm.media_url} onChange={(e) => setCreativeForm((f) => ({ ...f, media_url: e.target.value }))} className={inputCls} placeholder="https://drive.google.com/..." />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowNewCreative(false)} className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5">Cancelar</button>
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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {KANBAN_COLS.map((col) => {
                const colItems = approvals.filter((a) => a.status === col.key);
                return (
                  <div key={col.key} className={`bg-zinc-900 border rounded-lg p-3 ${col.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium ${col.text}`}>{col.label}</span>
                      <span className="text-xs text-zinc-600">{colItems.length}</span>
                    </div>
                    <div className="space-y-2">
                      {colItems.length === 0 ? (
                        <p className="text-xs text-zinc-700 py-2">Vazio</p>
                      ) : (
                        colItems.map((a) => (
                          <div key={a.id} className="bg-zinc-800/60 rounded-lg p-2.5">
                            <p className="text-xs text-white font-medium leading-tight truncate">{a.title}</p>
                            {a.client_feedback && (
                              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">"{a.client_feedback}"</p>
                            )}
                            {a.media_url && (
                              <a href={a.media_url} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-400 hover:underline mt-1 block">
                                Ver mídia →
                              </a>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tarefas do cliente */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Tarefas</p>
              <button
                onClick={() => setShowTaskForm((v) => !v)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                {showTaskForm ? <X size={12} /> : <Plus size={12} />}
                {showTaskForm ? "Cancelar" : "Nova tarefa"}
              </button>
            </div>

            {showTaskForm && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-3 mb-3">
                <input
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Título da tarefa"
                  className={inputCls}
                  onKeyDown={(e) => e.key === "Enter" && createClientTask()}
                />
                <div className="flex gap-2">
                  <select value={taskForm.priority} onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))} className={inputCls}>
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                  <input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm((f) => ({ ...f, due_date: e.target.value }))} className={inputCls} />
                </div>
                <button
                  onClick={createClientTask}
                  disabled={creatingTask || !taskForm.title.trim()}
                  className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                >
                  {creatingTask ? "Criando..." : "Criar tarefa"}
                </button>
              </div>
            )}

            {clientTasks.length === 0 ? (
              <p className="text-zinc-600 text-sm">Nenhuma tarefa pendente para este cliente.</p>
            ) : (
              <div className="space-y-2">
                {clientTasks.map((t) => (
                  <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-start gap-3">
                    <button
                      onClick={() => completeTask(t.id)}
                      className="mt-0.5 shrink-0 w-4 h-4 rounded-full border border-zinc-600 hover:border-emerald-400 hover:bg-emerald-400/10 transition-colors"
                      aria-label="Marcar como concluída"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[t.priority]}`} />
                        <span className="text-xs text-zinc-600">{t.priority === "high" ? "Alta" : t.priority === "medium" ? "Média" : "Baixa"}</span>
                        {t.due_date && <span className="text-xs text-zinc-600">· {new Date(t.due_date + "T00:00:00").toLocaleDateString("pt-BR")}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                  <input value={creativeForm.title} onChange={(e) => setCreativeForm((f) => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="Ex: Anúncio UGC - Produto X" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 block mb-1">URL da mídia *</label>
                  <input value={creativeForm.media_url} onChange={(e) => setCreativeForm((f) => ({ ...f, media_url: e.target.value }))} className={inputCls} placeholder="https://drive.google.com/..." />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Descrição</label>
                  <input value={creativeForm.description} onChange={(e) => setCreativeForm((f) => ({ ...f, description: e.target.value }))} className={inputCls} placeholder="Contexto do criativo" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">URL da thumbnail</label>
                  <input value={creativeForm.thumbnail_url} onChange={(e) => setCreativeForm((f) => ({ ...f, thumbnail_url: e.target.value }))} className={inputCls} placeholder="https://..." />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowNewCreative(false)} className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-xs">Cancelar</button>
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
            <p className="text-zinc-500 text-sm">Nenhum criativo enviado ainda.</p>
          ) : (
            approvals.map((a) => {
              const statusStyle: Record<string, string> = {
                pending:  "text-amber-400 bg-amber-500/10",
                approved: "text-emerald-400 bg-emerald-500/10",
                rejected: "text-red-400 bg-red-500/10",
                revision: "text-blue-400 bg-blue-500/10",
              };
              const statusLabel: Record<string, string> = {
                pending: "Aguardando", approved: "Aprovado", rejected: "Rejeitado", revision: "Revisão",
              };
              return (
                <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-4">
                  {a.thumbnail_url && (
                    <img src={a.thumbnail_url} alt="" className="w-20 h-20 rounded-lg object-cover bg-zinc-800 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{a.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{a.description}</p>
                    {a.client_feedback && (
                      <p className="text-xs text-zinc-400 bg-zinc-800 rounded px-2 py-1 mt-1.5">"{a.client_feedback}"</p>
                    )}
                    {a.media_url && (
                      <a href={a.media_url} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-400 hover:underline mt-1 block">
                        Ver mídia →
                      </a>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 h-fit rounded-full shrink-0 ${statusStyle[a.status] ?? "text-zinc-400 bg-zinc-700"}`}>
                    {statusLabel[a.status] ?? a.status}
                  </span>
                </div>
              );
            })
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
                    m.sender_type === "agency" ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-200"
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
            <button onClick={sendMessage} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-xl transition-colors">
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
