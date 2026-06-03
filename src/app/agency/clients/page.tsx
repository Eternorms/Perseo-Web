import { createClient } from '@/lib/supabase/server'
import { type Client } from '@/types'
import { MOCK_CLIENTS } from '@/lib/mock-data'
import NewClientModal from './new-client-modal'
import ClientsFilter from './filter'

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

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const currentFilter = status ?? 'all'

  const supabase = await createClient()
  let query = supabase.from('clients').select('*').order('created_at', { ascending: false })
  if (currentFilter !== 'all') {
    query = query.eq('status', currentFilter)
  }
  const { data: realClients } = await query

  const useMock = !realClients || realClients.length === 0
  const allClients = useMock ? MOCK_CLIENTS : (realClients as Client[])
  const clients = (currentFilter !== 'all' && useMock)
    ? allClients.filter(c => c.status === currentFilter)
    : allClients

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Clientes</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {clients.length} {currentFilter === 'all' ? 'clientes cadastrados' : statusLabel[currentFilter]?.toLowerCase() + 's'}
          </p>
        </div>
        <NewClientModal />
      </div>

      <ClientsFilter current={currentFilter} />

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        {clients.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-neutral-500 text-sm">Nenhum cliente neste filtro.</p>
            <p className="text-neutral-600 text-xs mt-1">Clique em "Novo cliente" para começar.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Clínica</th>
                <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Nicho</th>
                <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Plano</th>
                <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Agente</th>
                <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Desde</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr
                  key={c.id}
                  className={`hover:bg-neutral-800/40 transition-colors ${i < clients.length - 1 ? 'border-b border-neutral-800/50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{c.business_name}</p>
                    <p className="text-xs text-neutral-500">{c.contact_name ?? c.name}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{c.niche ?? '—'}</td>
                  <td className="px-4 py-3 text-neutral-400">{planLabel[c.plan] ?? c.plan}</td>
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
                  <td className="px-4 py-3 text-neutral-500 text-xs">
                    {new Date(c.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`/agency/clients/${c.id}`}
                      className="text-xs text-neutral-500 hover:text-white transition-colors"
                    >
                      Ver →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
