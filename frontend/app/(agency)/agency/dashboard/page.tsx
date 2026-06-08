"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, CheckCircle2, Plus, X } from "lucide-react";
import { api } from "@/lib/api";
import { Client, CreativeApproval, Task } from "@/lib/types";

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

const STAGE_BORDER: Record<string, string> = {
  active:   "border-emerald-500/30",
  prospect: "border-blue-500/30",
  at_risk:  "border-amber-500/30",
  paused:   "border-zinc-500/30",
  churned:  "border-red-500/30",
};

const PRIORITY_DOT: Record<string, string> = {
  high:   "bg-red-500",
  medium: "bg-amber-500",
  low:    "bg-zinc-500",
};

const PRIORITY_LABEL: Record<string, string> = {
  high: "Alta", medium: "Média", low: "Baixa",
};

const PIPELINE_STAGES = ["prospect", "active", "at_risk", "paused", "churned"] as const;

function fmt(n: number, prefix = "") {
  return `${prefix}${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [approvals, setApprovals] = useState<CreativeApproval[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", priority: "medium", due_date: "" });
  const [creatingTask, setCreatingTask] = useState(false);

  const loadTasks = useCallback(() => {
    api.get<Task[]>("/api/agency/tasks?status=todo")
      .then(setTasks)
      .catch(console.error);
  }, []);

  useEffect(() => {
    Promise.all([
      api.get<Client[]>("/api/agency/clients"),
      api.get<CreativeApproval[]>("/api/agency/approvals?status=pending"),
    ])
      .then(([c, a]) => { setClients(c); setApprovals(a); })
      .catch(console.error)
      .finally(() => setLoading(false));
    loadTasks();
  }, [loadTasks]);

  async function completeTask(id: number) {
    await api.patch(`/api/agency/tasks/${id}`, { status: "done" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function createTask() {
    if (!taskForm.title.trim()) return;
    setCreatingTask(true);
    try {
      await api.post("/api/agency/tasks", {
        title: taskForm.title,
        priority: taskForm.priority,
        due_date: taskForm.due_date || null,
      });
      setTaskForm({ title: "", priority: "medium", due_date: "" });
      setShowTaskForm(false);
      loadTasks();
    } finally {
      setCreatingTask(false);
    }
  }

  const active = clients.filter((c) => !["churned"].includes(c.stage));
  const mrr = clients
    .filter((c) => c.stage !== "churned")
    .reduce((s, c) => s + (c.plan_value ?? 0), 0);
  const atRisk = clients.filter((c) => c.stage === "at_risk");

  const stageCount = PIPELINE_STAGES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = clients.filter((c) => c.stage === s).length;
    return acc;
  }, {});

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Visão geral da agência</p>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-violet-950 border border-violet-800/50 rounded-xl px-5 py-5 lg:col-span-1">
          <p className="text-xs text-violet-400 uppercase tracking-widest font-medium">MRR</p>
          <p className="text-3xl font-bold text-violet-200 mt-2">{fmt(mrr, "R$ ")}</p>
          <p className="text-xs text-violet-600 mt-1">receita mensal</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-5">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Ativos</p>
          <p className="text-2xl font-bold text-white mt-2">{active.length}</p>
          <p className="text-xs text-zinc-600 mt-1">clientes</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-5">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Total</p>
          <p className="text-2xl font-bold text-white mt-2">{clients.length}</p>
          <p className="text-xs text-zinc-600 mt-1">cadastrados</p>
        </div>
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

      {/* Pipeline strip */}
      <div>
        <h2 className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">Pipeline</h2>
        <div className="grid grid-cols-5 gap-2">
          {PIPELINE_STAGES.map((stage) => (
            <div
              key={stage}
              className={`bg-zinc-900 border ${STAGE_BORDER[stage]} rounded-lg px-4 py-3 text-center`}
            >
              <p className={`text-2xl font-bold ${
                stage === "active"   ? "text-emerald-400" :
                stage === "at_risk"  ? "text-amber-400" :
                stage === "prospect" ? "text-blue-400" :
                stage === "churned"  ? "text-red-400" :
                                       "text-zinc-400"
              }`}>{stageCount[stage]}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{STAGE_LABEL[stage]}</p>
            </div>
          ))}
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

      {/* Conteúdo principal — tabela de clientes + tarefas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Tabela de clientes */}
        <div className="xl:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
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
                    <th key={h} className="px-5 py-3 text-left text-xs text-zinc-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/agency/clients/${c.id}`} className="text-violet-400 hover:text-violet-300 font-medium">
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
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        STAGE_COLOR[c.stage] ?? "bg-zinc-700 text-zinc-300"
                      }`}>
                        {STAGE_LABEL[c.stage] ?? c.stage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Widget de tarefas */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">Tarefas</h2>
            <button
              onClick={() => setShowTaskForm((v) => !v)}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
              aria-label="Nova tarefa"
            >
              {showTaskForm ? <X size={13} /> : <Plus size={13} />}
              {showTaskForm ? "Cancelar" : "Nova"}
            </button>
          </div>

          {showTaskForm && (
            <div className="px-5 py-4 border-b border-zinc-800 space-y-3 bg-zinc-800/40">
              <input
                value={taskForm.title}
                onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Título da tarefa"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                onKeyDown={(e) => e.key === "Enter" && createTask()}
              />
              <div className="flex gap-2">
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
                <input
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm((f) => ({ ...f, due_date: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:border-violet-500"
                />
              </div>
              <button
                onClick={createTask}
                disabled={creatingTask || !taskForm.title.trim()}
                className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm rounded transition-colors"
              >
                {creatingTask ? "Criando..." : "Criar tarefa"}
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800">
            {tasks.length === 0 ? (
              <p className="px-5 py-8 text-zinc-600 text-sm text-center">Nenhuma tarefa pendente</p>
            ) : (
              tasks.slice(0, 8).map((t) => (
                <div key={t.id} className="px-5 py-3 flex items-start gap-3 hover:bg-zinc-800/20">
                  <button
                    onClick={() => completeTask(t.id)}
                    className="mt-0.5 shrink-0 w-4 h-4 rounded-full border border-zinc-600 hover:border-emerald-400 hover:bg-emerald-400/10 transition-colors"
                    aria-label="Marcar como concluída"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white leading-tight truncate">{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[t.priority]}`} />
                      <span className="text-xs text-zinc-600">{PRIORITY_LABEL[t.priority]}</span>
                      {t.client_brand && (
                        <span className="text-xs text-zinc-600 truncate">· {t.client_brand}</span>
                      )}
                    </div>
                  </div>
                  {t.due_date && (
                    <span className="text-xs text-zinc-600 shrink-0">{fmtDate(t.due_date)}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
