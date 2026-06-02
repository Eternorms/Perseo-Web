import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AgencyDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString()
  const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 7).toISOString()

  const [
    { count: totalClients },
    { count: activeClients },
    { count: leadsToday },
    { count: appointmentsWeek },
    { data: recentClients },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', startOfDay),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .gte('scheduled_at', startOfWeek).lt('scheduled_at', endOfWeek).eq('status', 'scheduled'),
    supabase.from('clients').select('id, name, business_name, status, niche, created_at')
      .order('created_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: 'Clientes ativos', value: activeClients ?? 0, sub: `${totalClients ?? 0} total` },
    { label: 'Leads hoje', value: leadsToday ?? 0, sub: 'captados via Meta' },
    { label: 'Agendamentos', value: appointmentsWeek ?? 0, sub: 'esta semana' },
  ]

  const statusColor: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-400',
    onboarding: 'bg-amber-500/15 text-amber-400',
    paused: 'bg-neutral-500/15 text-neutral-400',
    churned: 'bg-red-500/15 text-red-400',
  }

  const statusLabel: Record<string, string> = {
    active: 'Ativo',
    onboarding: 'Onboarding',
    paused: 'Pausado',
    churned: 'Churn',
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-white">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Visão geral da agência</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">{s.label}</p>
            <p className="text-3xl font-semibold text-white mt-2">{s.value}</p>
            <p className="text-xs text-neutral-600 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Clientes recentes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-neutral-300">Clientes recentes</h2>
          <a href="/agency/clients" className="text-xs text-neutral-500 hover:text-white transition-colors">
            Ver todos →
          </a>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          {!recentClients || recentClients.length === 0 ? (
            <div className="p-6 text-center text-sm text-neutral-600">Nenhum cliente cadastrado ainda.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Clínica</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Nicho</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Desde</th>
                </tr>
              </thead>
              <tbody>
                {recentClients.map((c, i) => (
                  <tr key={c.id} className={i < recentClients.length - 1 ? 'border-b border-neutral-800/50' : ''}>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{c.business_name}</p>
                      <p className="text-xs text-neutral-500">{c.name}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-400">{c.niche ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status] ?? 'bg-neutral-700 text-neutral-300'}`}>
                        {statusLabel[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
