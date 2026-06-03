import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  MOCK_CLIENTS, MOCK_STATS, MOCK_AGENT_STATS, MOCK_TASKS,
} from '@/lib/mock-data'
import { type Client, type Task } from '@/types'

const statusColor: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400',
  onboarding: 'bg-amber-500/15 text-amber-400',
  paused: 'bg-neutral-500/15 text-neutral-400',
  churned: 'bg-red-500/15 text-red-400',
}
const statusLabel: Record<string, string> = {
  active: 'Ativo', onboarding: 'Onboarding', paused: 'Pausado', churned: 'Churn',
}
const planLabel: Record<string, string> = {
  starter: 'Starter', growth: 'Growth', scale: 'Scale',
}
const priorityColor: Record<string, string> = {
  high: 'bg-red-500/15 text-red-400',
  medium: 'bg-amber-500/15 text-amber-400',
  low: 'bg-neutral-500/15 text-neutral-400',
}
const taskStatusLabel: Record<string, string> = {
  backlog: 'Backlog', todo: 'A fazer', in_progress: 'Em progresso', review: 'Revisão', done: 'Concluído',
}

function fmtMRR(val: number) {
  return val >= 1000 ? `R$ ${(val / 1000).toFixed(1).replace('.', ',')}k` : `R$ ${val}`
}

function MRRGrowth({ current, prev }: { current: number; prev: number }) {
  const pct = Math.round(((current - prev) / prev) * 100)
  const up = pct >= 0
  return (
    <span className={`text-xs font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      {up ? '↑' : '↓'} {Math.abs(pct)}% vs mês anterior
    </span>
  )
}

export default async function AgencyDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString()
  const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 7).toISOString()

  const [
    { data: realClients },
    { count: leadsToday },
    { count: appointmentsWeek },
    { data: realTasks },
  ] = await Promise.all([
    supabase.from('clients').select('*').order('created_at', { ascending: false }),
    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', startOfDay),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .gte('scheduled_at', startOfWeek).lt('scheduled_at', endOfWeek),
    supabase.from('tasks').select('id, title, priority, status')
      .neq('status', 'done').in('priority', ['high', 'medium'])
      .order('priority', { ascending: false }).limit(3),
  ])

  const useMock = !realClients || realClients.length === 0
  const clients = (useMock ? MOCK_CLIENTS : realClients) as Client[]
  const tasks = (useMock ? MOCK_TASKS : realTasks ?? []) as Pick<Task, 'id' | 'title' | 'priority' | 'status'>[]

  const activeClients = clients.filter(c => c.status === 'active')
  const onboardingClients = clients.filter(c => c.status === 'onboarding')
  const pausedClients = clients.filter(c => c.status === 'paused')
  const churnedClients = clients.filter(c => c.status === 'churned')

  const mrr = useMock ? MOCK_STATS.mrr : clients.reduce((s, c) => s + (c.monthly_value ?? 0), 0)
  const mrrPrev = useMock ? MOCK_STATS.mrrPrev : Math.round(mrr * 0.88)

  const leadsWeek = useMock ? MOCK_STATS.leadsWeek : (leadsToday ?? 0)
  const apptWeek = useMock ? MOCK_STATS.appointmentsWeek : (appointmentsWeek ?? 0)
  const convRate = useMock ? MOCK_STATS.conversionRate : (leadsWeek > 0 ? Math.round((apptWeek / leadsWeek) * 100) : 0)

  const agentStats = useMock ? MOCK_AGENT_STATS : clients.map(c => ({
    client_id: c.id,
    business_name: c.business_name,
    leadsToday: 0,
    actionsToday: 0,
    agent_active: c.agent_active,
  }))

  const pipelineMax = Math.max(activeClients.length, onboardingClients.length, pausedClients.length, 1)

  const recentClients = clients.slice(0, 5)

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Visão geral da agência</p>
        </div>
      </div>

      {/* Banner modo demo */}
      {useMock && (
        <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-400">
            Exibindo dados de exemplo. Cadastre seu primeiro cliente para ver dados reais.
          </p>
          <Link
            href="/agency/clients"
            className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap ml-4"
          >
            + Novo cliente →
          </Link>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* MRR */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-2">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">MRR</p>
          <p className="text-2xl font-semibold text-white">{fmtMRR(mrr)}</p>
          <MRRGrowth current={mrr} prev={mrrPrev} />
        </div>
        {/* Clientes */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-2">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Clientes</p>
          <p className="text-2xl font-semibold text-white">{activeClients.length}</p>
          <span className="text-xs text-neutral-600">{clients.length} total</span>
        </div>
        {/* Leads */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-2">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Leads esta semana</p>
          <p className="text-2xl font-semibold text-white">{leadsWeek}</p>
          <span className="text-xs text-neutral-600">via Agente WhatsApp</span>
        </div>
        {/* Conversão */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-2">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Conversão</p>
          <p className="text-2xl font-semibold text-white">{convRate}%</p>
          <span className="text-xs text-neutral-600">lead → agendamento</span>
        </div>
        {/* Agendamentos */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-2">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Agendamentos</p>
          <p className="text-2xl font-semibold text-white">{apptWeek}</p>
          <span className="text-xs text-neutral-600">esta semana</span>
        </div>
      </div>

      {/* Meio: pipeline + agentes */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Pipeline */}
        <div className="lg:col-span-3 bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-medium text-neutral-300">Pipeline de clientes</h2>
          <div className="space-y-3">
            {[
              { label: 'Ativos', count: activeClients.length, color: 'bg-emerald-500' },
              { label: 'Onboarding', count: onboardingClients.length, color: 'bg-amber-500' },
              { label: 'Pausados', count: pausedClients.length, color: 'bg-neutral-500' },
              { label: 'Churn', count: churnedClients.length, color: 'bg-red-500' },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="text-xs text-neutral-500 w-20 shrink-0">{row.label}</span>
                <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${row.color}`}
                    style={{ width: row.count === 0 ? '2px' : `${Math.max(4, Math.round((row.count / pipelineMax) * 100))}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-neutral-300 w-6 text-right">{row.count}</span>
              </div>
            ))}
          </div>

          {/* Distribuição de planos */}
          <div className="pt-2 border-t border-neutral-800">
            <p className="text-xs text-neutral-500 mb-2">Distribuição por plano</p>
            <div className="flex gap-3">
              {['starter', 'growth', 'scale'].map(p => {
                const count = clients.filter(c => c.plan === p).length
                return (
                  <div key={p} className="flex items-center gap-1.5">
                    <span className="text-xs text-neutral-400">{planLabel[p]}</span>
                    <span className="text-xs font-medium text-white bg-neutral-800 rounded px-1.5 py-0.5">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Agentes */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-300">Agentes por cliente</h2>
            <Link href="/agency/clients" className="text-xs text-neutral-500 hover:text-white transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-2">
            {agentStats.map(a => (
              <div key={a.client_id} className="flex items-center justify-between py-1.5 border-b border-neutral-800/50 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white truncate">{a.business_name}</p>
                  {a.agent_active && (
                    <p className="text-xs text-neutral-600">{a.leadsToday} leads hoje</p>
                  )}
                </div>
                <span className={`ml-3 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${a.agent_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-neutral-700/50 text-neutral-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${a.agent_active ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
                  {a.agent_active ? 'Ativo' : 'Setup'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inferior: clientes recentes + tarefas */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Clientes recentes */}
        <div className="lg:col-span-3 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <h2 className="text-sm font-medium text-neutral-300">Clientes recentes</h2>
            <Link href="/agency/clients" className="text-xs text-neutral-500 hover:text-white transition-colors">
              Ver todos →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-4 py-2.5 text-xs text-neutral-500 font-medium">Clínica</th>
                <th className="text-left px-4 py-2.5 text-xs text-neutral-500 font-medium">Plano</th>
                <th className="text-left px-4 py-2.5 text-xs text-neutral-500 font-medium">Agente</th>
                <th className="text-left px-4 py-2.5 text-xs text-neutral-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentClients.map((c, i) => (
                <tr key={c.id} className={i < recentClients.length - 1 ? 'border-b border-neutral-800/50' : ''}>
                  <td className="px-4 py-3">
                    <p className="text-white text-xs font-medium">{c.business_name}</p>
                    <p className="text-xs text-neutral-600">{c.niche ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-400">{planLabel[c.plan] ?? c.plan}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${c.agent_active ? 'text-emerald-400' : 'text-neutral-600'}`}>
                      {c.agent_active ? '● Ativo' : '○ Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status] ?? 'bg-neutral-700 text-neutral-300'}`}>
                      {statusLabel[c.status] ?? c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tarefas urgentes */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <h2 className="text-sm font-medium text-neutral-300">Tarefas urgentes</h2>
            <Link href="/agency/kanban" className="text-xs text-neutral-500 hover:text-white transition-colors">
              Ver Kanban →
            </Link>
          </div>
          {tasks.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-600">Nenhuma tarefa pendente.</div>
          ) : (
            <div className="divide-y divide-neutral-800/50">
              {tasks.map(t => (
                <div key={t.id} className="px-4 py-3 space-y-1.5">
                  <p className="text-xs text-white">{t.title}</p>
                  <div className="flex gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${priorityColor[t.priority] ?? ''}`}>
                      {t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-xs text-neutral-500 bg-neutral-800">
                      {taskStatusLabel[t.status] ?? t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
