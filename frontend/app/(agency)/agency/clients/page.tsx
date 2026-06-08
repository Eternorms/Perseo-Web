"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Client } from "@/lib/types";

const STAGE_LABEL: Record<string, string> = {
  active:   "Ativo",
  prospect: "Prospect",
  at_risk:  "Em risco",
  paused:   "Pausado",
  churned:  "Churn",
};

const STAGE_BORDER: Record<string, string> = {
  active:   "border-l-emerald-500",
  prospect: "border-l-blue-500",
  at_risk:  "border-l-amber-500",
  paused:   "border-l-zinc-500",
  churned:  "border-l-red-500",
};

function NewClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "", brand: "", niche: "", plan: "Standard",
    plan_value: "", monthly_budget: "", client_email: "", client_whatsapp: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/api/agency/clients", {
        ...form,
        plan_value: form.plan_value ? Number(form.plan_value) : null,
        monthly_budget: form.monthly_budget ? Number(form.monthly_budget) : null,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar cliente");
    } finally {
      setSaving(false);
    }
  }

  const field = (id: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      <input
        type={type}
        value={form[id]}
        onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Novo Cliente</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-zinc-500 hover:text-zinc-300 text-xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field("name", "Nome completo *")}
            {field("brand", "Marca *")}
            {field("niche", "Nicho *")}
            {field("plan", "Plano")}
            {field("plan_value", "Mensalidade (R$)", "number", "0")}
            {field("monthly_budget", "Verba tráfego (R$)", "number", "0")}
            {field("client_email", "E-mail", "email")}
            {field("client_whatsapp", "WhatsApp", "tel", "+55...")}
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-zinc-400 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !form.name || !form.brand || !form.niche}
              className="flex-1 px-4 py-2 text-sm text-white bg-violet-600 rounded hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Salvando..." : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showModal, setShowModal] = useState(false);

  function loadClients() {
    setLoading(true);
    setLoadError("");
    api.get<Client[]>("/api/agency/clients")
      .then(setClients)
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Erro ao carregar clientes"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadClients(); }, []);

  const filtered = clients.filter(
    (c) =>
      c.brand.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.niche.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      {showModal && (
        <NewClientModal onClose={() => setShowModal(false)} onCreated={loadClients} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Clientes</h1>
          <p className="text-zinc-400 text-sm mt-1">{clients.length} clientes cadastrados</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Buscar marca, nome, nicho..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-white w-56 focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 text-sm text-white bg-violet-600 rounded-md hover:bg-violet-500 transition-colors"
          >
            + Novo Cliente
          </button>
        </div>
      </div>

      {loadError && (
        <p className="text-red-400 text-sm font-mono bg-zinc-900 border border-red-800/40 rounded px-4 py-3">{loadError}</p>
      )}
      {loading ? (
        <p className="text-zinc-500 text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-500 text-sm mb-4">
            {search ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
          </p>
          {!search && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-sm text-white bg-violet-600 rounded-md hover:bg-violet-500 transition-colors"
            >
              Criar primeiro cliente
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/agency/clients/${c.id}`}
              className={`bg-zinc-900 border border-zinc-800 border-l-2 ${STAGE_BORDER[c.stage] ?? "border-l-zinc-700"} rounded-lg p-5 hover:border-zinc-600 transition-colors`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{c.brand}</h3>
                  <p className="text-xs text-zinc-500">{c.name}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  c.stage === "active"   ? "bg-emerald-500/20 text-emerald-400" :
                  c.stage === "at_risk"  ? "bg-amber-500/20 text-amber-400" :
                  c.stage === "prospect" ? "bg-blue-500/20 text-blue-400" :
                                          "bg-zinc-700 text-zinc-400"
                }`}>
                  {STAGE_LABEL[c.stage] ?? c.stage}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-zinc-500">Nicho</p>
                  <p className="text-zinc-300">{c.niche}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Mensalidade</p>
                  <p className="text-zinc-300">{c.plan_value ? `R$ ${c.plan_value.toLocaleString("pt-BR")}` : c.plan}</p>
                </div>
                {c.current_roas != null && (
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
