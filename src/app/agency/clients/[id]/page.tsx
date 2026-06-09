import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { type Client, type Lead, type Appointment, type AgentAction } from '@/types'
import ClientTabs from './client-tabs'
import InviteClientModal from './invite-client-modal'

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

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const admin = createAdminClient()

  const [{ data: client }, { data: leads }, { data: appointments }, { data: agentActions }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('leads').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('appointments').select('*').eq('client_id', id).order('scheduled_at', { ascending: false }),
    supabase.from('agent_actions').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(50),
  ])

  if (!client) notFound()

  const c = client as Client

  // Busca criativos do perseo_client_id correspondente
  const perseoId = c.perseo_client_id ?? null
  const { data: approvals } = perseoId
    ? await admin.schema('perseo').from('creative_approvals')
        .select('id, title, status, client_feedback, submitted_at, scheduled_at, media_url')
        .eq('client_id', perseoId)
        .order('submitted_at', { ascending: false })
    : { data: [] }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <a href="/agency/clients" className="text-xs text-neutral-500 hover:text-white transition-colors">
              ← Clientes
            </a>
          </div>
          <h1 className="text-lg font-semibold text-white">{c.business_name}</h1>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status] ?? ''}`}>
              {statusLabel[c.status] ?? c.status}
            </span>
            <span className="text-xs text-neutral-500">{c.contact_email ?? ''}</span>
            {c.contact_phone && <span className="text-xs text-neutral-500">{c.contact_phone}</span>}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-right space-y-1">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Plano</p>
            <p className="text-sm text-white font-medium capitalize">{c.plan}</p>
          </div>
          <InviteClientModal clientId={c.id} />
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Leads" value={leads?.length ?? 0} />
        <Stat label="Agendamentos" value={appointments?.length ?? 0} />
        <Stat
          label="Agente"
          value={c.agent_active ? 'Ativo' : 'Inativo'}
          highlight={c.agent_active}
        />
      </div>

      {/* Abas */}
      <ClientTabs
        client={c}
        leads={(leads as Lead[]) ?? []}
        appointments={(appointments as Appointment[]) ?? []}
        agentActions={(agentActions as AgentAction[]) ?? []}
        approvals={(approvals ?? []) as any}
      />
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <p className="text-xs text-neutral-500 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
    </div>
  )
}
