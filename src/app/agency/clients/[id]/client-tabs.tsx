'use client'

import { useState } from 'react'
import { type Client, type Lead, type Appointment } from '@/types'
import EditClientForm from './edit-client-form'

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

interface Props {
  client: Client
  leads: Lead[]
  appointments: Appointment[]
}

const tabs = ['Visão Geral', 'Leads', 'Agendamentos']

export default function ClientTabs({ client, leads, appointments }: Props) {
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
          </button>
        ))}
      </div>

      {active === 0 && <EditClientForm client={client} />}

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
    </div>
  )
}
