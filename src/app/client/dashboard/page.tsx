import { getClientContext } from '@/lib/get-client-context'
import { type Client, type Lead, type Appointment } from '@/types'

const leadStatusColor: Record<string, string> = {
  new: 'bg-blue-500/15 text-blue-400',
  contacted: 'bg-amber-500/15 text-amber-400',
  qualified: 'bg-purple-500/15 text-purple-400',
  scheduled: 'bg-emerald-500/15 text-emerald-400',
  converted: 'bg-emerald-700/20 text-emerald-300',
  lost: 'bg-red-500/15 text-red-400',
}
const leadStatusLabel: Record<string, string> = {
  new: 'Novo', contacted: 'Contactado', qualified: 'Qualificado',
  scheduled: 'Agendado', converted: 'Convertido', lost: 'Perdido',
}
const apptStatusColor: Record<string, string> = {
  scheduled: 'bg-blue-500/15 text-blue-400',
  confirmed: 'bg-emerald-500/15 text-emerald-400',
  cancelled: 'bg-red-500/15 text-red-400',
  completed: 'bg-neutral-500/15 text-neutral-400',
  no_show: 'bg-orange-500/15 text-orange-400',
}
const apptStatusLabel: Record<string, string> = {
  scheduled: 'Agendado', confirmed: 'Confirmado', cancelled: 'Cancelado',
  completed: 'Realizado', no_show: 'Faltou',
}

export default async function ClientDashboardPage() {
  const { supabase, clientId } = await getClientContext()

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86400000)
  const weekAhead = new Date(now.getTime() + 7 * 86400000)

  const [
    { data: client },
    { data: allLeads },
    { data: recentLeads },
    { data: upcomingAppts },
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('id', clientId).single(),
    supabase.from('leads').select('status, created_at').eq('client_id', clientId),
    supabase.from('leads').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(5),
    supabase.from('appointments').select('*').eq('client_id', clientId)
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', weekAhead.toISOString())
      .order('scheduled_at').limit(3),
  ])

  const c = client as Client
  const leads = allLeads ?? []
  const totalLeads = leads.length
  const convertedLeads = leads.filter(l => l.status === 'converted').length
  const leadsThisWeek = leads.filter(l => new Date(l.created_at) >= weekAgo).length
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">{c?.business_name ?? 'Dashboard'}</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Visão geral da sua clínica</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Leads esta semana" value={leadsThisWeek} />
        <Stat label="Próximos agendamentos" value={upcomingAppts?.length ?? 0} />
        <Stat label="Taxa de conversão" value={`${conversionRate}%`} highlight={conversionRate > 0} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Leads recentes</h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            {!recentLeads || recentLeads.length === 0 ? (
              <div className="p-6 text-center text-sm text-neutral-600">Nenhum lead ainda.</div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {(recentLeads as Lead[]).map((l, i) => (
                    <tr key={l.id} className={i < recentLeads.length - 1 ? 'border-b border-neutral-800/50' : ''}>
                      <td className="px-4 py-3">
                        <p className="text-white text-xs font-medium">{l.name ?? l.phone}</p>
                        <p className="text-xs text-neutral-500">{new Date(l.created_at).toLocaleDateString('pt-BR')}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${leadStatusColor[l.status] ?? ''}`}>
                          {leadStatusLabel[l.status] ?? l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Próximos agendamentos</h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            {!upcomingAppts || upcomingAppts.length === 0 ? (
              <div className="p-6 text-center text-sm text-neutral-600">Nenhum agendamento próximo.</div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {(upcomingAppts as Appointment[]).map((a, i) => (
                    <tr key={a.id} className={i < upcomingAppts.length - 1 ? 'border-b border-neutral-800/50' : ''}>
                      <td className="px-4 py-3">
                        <p className="text-white text-xs font-medium">{a.patient_name}</p>
                        <p className="text-xs text-neutral-500">
                          {new Date(a.scheduled_at).toLocaleDateString('pt-BR')}{' '}
                          {new Date(a.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${apptStatusColor[a.status] ?? ''}`}>
                          {apptStatusLabel[a.status] ?? a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {c && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Agente de IA</p>
            <p className={`text-sm font-medium mt-0.5 ${c.agent_active ? 'text-emerald-400' : 'text-neutral-400'}`}>
              {c.agent_active ? 'Ativo — respondendo leads automaticamente' : 'Inativo — ative em Configurações'}
            </p>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full ${c.agent_active ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`} />
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <p className="text-xs text-neutral-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
    </div>
  )
}
