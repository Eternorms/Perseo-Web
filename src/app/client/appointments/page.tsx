import { getClientContext } from '@/lib/get-client-context'
import { type Appointment } from '@/types'
import AppointmentsFilter from './filter'

export default async function ClientAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { supabase, clientId } = await getClientContext()
  const { status } = await searchParams

  let query = supabase
    .from('appointments')
    .select('*')
    .eq('client_id', clientId)
    .order('scheduled_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: appointments } = await query

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Agendamentos</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{appointments?.length ?? 0} registros</p>
        </div>
        <AppointmentsFilter current={status ?? 'all'} />
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        {!appointments || appointments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-neutral-500 text-sm">Nenhum agendamento encontrado.</p>
          </div>
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
              {(appointments as Appointment[]).map((a, i) => (
                <tr key={a.id} className={i < appointments.length - 1 ? 'border-b border-neutral-800/50' : ''}>
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{a.patient_name}</p>
                    {a.patient_phone && <p className="text-xs text-neutral-500">{a.patient_phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {new Date(a.scheduled_at).toLocaleDateString('pt-BR')}{' '}
                    <span className="text-neutral-500">
                      {new Date(a.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">{a.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const statusColor: Record<string, string> = {
  scheduled: 'bg-blue-500/15 text-blue-400',
  confirmed: 'bg-emerald-500/15 text-emerald-400',
  cancelled: 'bg-red-500/15 text-red-400',
  completed: 'bg-neutral-500/15 text-neutral-400',
  no_show: 'bg-orange-500/15 text-orange-400',
}
const statusLabel: Record<string, string> = {
  scheduled: 'Agendado', confirmed: 'Confirmado', cancelled: 'Cancelado',
  completed: 'Realizado', no_show: 'Faltou',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[status] ?? 'bg-neutral-700 text-neutral-300'}`}>
      {statusLabel[status] ?? status}
    </span>
  )
}
