'use client'

import { useState, useTransition } from 'react'
import { type Client, type Lead, type Appointment, type AgentAction } from '@/types'
import EditClientForm from './edit-client-form'
import { scheduleCreativeAction, resubmitCreativeAction } from '../../../criativos/actions'

const leadStatusColor: Record<string, string> = {
  new: 'bg-blue-500/15 text-blue-400',
  contacted: 'bg-amber-500/15 text-amber-400',
  qualified: 'bg-purple-500/15 text-purple-400',
  scheduled: 'bg-emerald-500/15 text-emerald-400',
  converted: 'bg-emerald-700/20 text-emerald-300',
  lost: 'bg-red-500/15 text-red-400',
}

const leadStatusLabel: Record<string, string> = {
  new: 'Novo',
  contacted: 'Contactado',
  qualified: 'Qualificado',
  scheduled: 'Agendado',
  converted: 'Convertido',
  lost: 'Perdido',
}

const apptStatusColor: Record<string, string> = {
  scheduled: 'bg-blue-500/15 text-blue-400',
  confirmed: 'bg-emerald-500/15 text-emerald-400',
  cancelled: 'bg-red-500/15 text-red-400',
  completed: 'bg-neutral-500/15 text-neutral-400',
  no_show: 'bg-orange-500/15 text-orange-400',
}

const apptStatusLabel: Record<string, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Realizado',
  no_show: 'Faltou',
}

const actionTypeLabel: Record<string, string> = {
  send_message: 'Mensagem enviada',
  cancel_appointment: 'Agendamento cancelado',
  reschedule: 'Reagendamento',
  qualify_lead: 'Lead qualificado',
}

const actionStatusColor: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  done: 'bg-emerald-500/15 text-emerald-400',
  failed: 'bg-red-500/15 text-red-400',
}

type Approval = {
  id: number
  title: string | null
  status: string
  client_feedback: string | null
  submitted_at: string
  scheduled_at: string | null
  media_url: string | null
}

interface Props {
  client: Client
  leads: Lead[]
  appointments: Appointment[]
  agentActions: AgentAction[]
  approvals?: Approval[]
}

const tabs = ['Visão Geral', 'Leads', 'Agendamentos', 'Criativos', 'Agente']

export default function ClientTabs({ client, leads, appointments, agentActions, approvals = [] }: Props) {
  const [active, setActive] = useState(0)

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-neutral-800">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActive(i)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active === i
                ? 'border-white text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {tab}
            {i === 1 && leads.length > 0 && (
              <span className="ml-2 text-xs bg-neutral-700 text-neutral-300 px-1.5 py-0.5 rounded-full">
                {leads.length}
              </span>
            )}
            {i === 2 && appointments.length > 0 && (
              <span className="ml-2 text-xs bg-neutral-700 text-neutral-300 px-1.5 py-0.5 rounded-full">
                {appointments.length}
              </span>
            )}
            {i === 3 && approvals.filter(a => a.status === 'revision').length > 0 && (
              <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
                {approvals.filter(a => a.status === 'revision').length} revisão
              </span>
            )}
          </button>
        ))}
      </div>

      {active === 0 && <EditClientForm client={client} />}

      {active === 3 && <ApprovalsTab approvals={approvals} />}

      {active === 1 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          {leads.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-600">Nenhum lead ainda.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Lead</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Telefone</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Tempo resposta</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Captado em</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l, i) => (
                  <tr key={l.id} className={i < leads.length - 1 ? 'border-b border-neutral-800/50' : ''}>
                    <td className="px-4 py-3">
                      <p className="text-white">{l.name ?? '—'}</p>
                      <p className="text-xs text-neutral-500">{l.email ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-400">{l.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${leadStatusColor[l.status] ?? ''}`}>
                        {leadStatusLabel[l.status] ?? l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-400 text-xs">
                      {l.response_time_seconds != null
                        ? l.response_time_seconds < 60
                          ? `${l.response_time_seconds}s`
                          : `${Math.round(l.response_time_seconds / 60)}min`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">
                      {new Date(l.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {active === 2 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          {appointments.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-600">Nenhum agendamento ainda.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Paciente</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Data/Hora</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Notas</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a, i) => (
                  <tr key={a.id} className={i < appointments.length - 1 ? 'border-b border-neutral-800/50' : ''}>
                    <td className="px-4 py-3">
                      <p className="text-white">{a.patient_name}</p>
                      <p className="text-xs text-neutral-500">{a.patient_phone ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {new Date(a.scheduled_at).toLocaleDateString('pt-BR')}{' '}
                      <span className="text-neutral-500">
                        {new Date(a.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${apptStatusColor[a.status] ?? ''}`}>
                        {apptStatusLabel[a.status] ?? a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">{a.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {active === 4 && (
        <div className="space-y-4">
          {/* Stats do agente */}
          <div className="grid grid-cols-3 gap-3">
            <AgentStat label="Total de ações" value={agentActions.length} />
            <AgentStat
              label="Taxa de sucesso"
              value={agentActions.length === 0 ? '—' : `${Math.round((agentActions.filter(a => a.status === 'done').length / agentActions.length) * 100)}%`}
              highlight
            />
            <AgentStat
              label="Status atual"
              value={client.agent_active ? 'Ativo' : 'Inativo'}
              highlight={client.agent_active}
            />
          </div>

          {/* Histórico */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            {agentActions.length === 0 ? (
              <div className="p-8 text-center text-sm text-neutral-600">Nenhuma ação registrada ainda.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Ação</th>
                    <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Alvo</th>
                    <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {agentActions.map((a, i) => (
                    <tr key={a.id} className={i < agentActions.length - 1 ? 'border-b border-neutral-800/50' : ''}>
                      <td className="px-4 py-3 text-neutral-300 text-xs">{actionTypeLabel[a.action_type] ?? a.action_type}</td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">{a.target_phone ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionStatusColor[a.status] ?? ''}`}>
                          {a.status === 'done' ? 'Concluído' : a.status === 'failed' ? 'Falhou' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">
                        {new Date(a.created_at).toLocaleDateString('pt-BR')}{' '}
                        {new Date(a.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AgentStat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <p className="text-xs text-neutral-500 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
    </div>
  )
}

const APPR_STATUS_LABEL: Record<string, string> = {
  pending: 'Aguard. cliente', approved: 'Aprovado', rejected: 'Rejeitado', revision: 'Revisão',
}
const APPR_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  rejected: 'bg-red-500/15 text-red-400',
  revision: 'bg-blue-500/15 text-blue-400',
}

function ApprovalsTab({ approvals }: { approvals: Approval[] }) {
  const [scheduling, setScheduling] = useState<number | null>(null)
  const [schedDate, setSchedDate] = useState('')
  const [isPending, startTransition] = useTransition()

  function saveSchedule(id: number) {
    if (!schedDate) return
    startTransition(async () => {
      await scheduleCreativeAction(id, new Date(schedDate).toISOString())
      setScheduling(null)
      setSchedDate('')
    })
  }

  function resubmit(id: number) {
    startTransition(async () => { await resubmitCreativeAction(id) })
  }

  if (approvals.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-sm text-neutral-600">
        Nenhum criativo produzido ainda.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {approvals.map(a => (
        <div key={a.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{a.title ?? 'Criativo sem título'}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Enviado {new Date(a.submitted_at).toLocaleDateString('pt-BR')}
                {a.scheduled_at && ` · Publicação: ${new Date(a.scheduled_at).toLocaleDateString('pt-BR')}`}
              </p>
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${APPR_STATUS_COLOR[a.status] ?? ''}`}>
              {APPR_STATUS_LABEL[a.status] ?? a.status}
            </span>
          </div>

          {a.status === 'revision' && a.client_feedback && (
            <div className="bg-blue-950/40 border border-blue-800/30 rounded-lg px-3 py-2">
              <p className="text-xs font-medium text-blue-300 mb-0.5">Feedback:</p>
              <p className="text-xs text-blue-100">{a.client_feedback}</p>
            </div>
          )}

          <div className="flex gap-2">
            {a.status === 'approved' && (
              scheduling === a.id ? (
                <div className="flex gap-2 flex-1">
                  <input
                    type="datetime-local"
                    value={schedDate}
                    onChange={e => setSchedDate(e.target.value)}
                    className="flex-1 px-2 py-1 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-neutral-500"
                  />
                  <button onClick={() => saveSchedule(a.id)} disabled={isPending} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg disabled:opacity-40">
                    OK
                  </button>
                  <button onClick={() => setScheduling(null)} className="px-3 py-1 text-neutral-500 hover:text-white text-xs">×</button>
                </div>
              ) : (
                <button
                  onClick={() => { setScheduling(a.id); setSchedDate(a.scheduled_at ? new Date(a.scheduled_at).toISOString().slice(0, 16) : '') }}
                  className="text-xs px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
                >
                  {a.scheduled_at ? 'Alterar data' : 'Agendar publicação'}
                </button>
              )
            )}
            {a.status === 'revision' && (
              <button onClick={() => resubmit(a.id)} disabled={isPending} className="text-xs px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg border border-blue-600/30 transition-colors disabled:opacity-40">
                Reenviar para aprovação
              </button>
            )}
            {a.media_url && (
              <a href={a.media_url} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-lg transition-colors ml-auto">
                Ver mídia ↗
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
