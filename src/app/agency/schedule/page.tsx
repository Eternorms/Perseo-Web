import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CancelButton from './cancel-button'

const statusColor: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  published: 'bg-emerald-500/15 text-emerald-400',
  failed: 'bg-red-500/15 text-red-400',
  cancelled: 'bg-neutral-500/15 text-neutral-500',
}
const statusLabel: Record<string, string> = {
  pending: 'Agendado', published: 'Publicado', failed: 'Falhou', cancelled: 'Cancelado',
}
const platformLabel: Record<string, string> = {
  instagram: 'Instagram', facebook: 'Facebook',
}

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: posts } = await supabase
    .from('social_posts')
    .select('*, clients(business_name)')
    .order('scheduled_at', { ascending: true })
    .limit(100)

  const upcoming = (posts ?? []).filter(p => p.status === 'pending')
  const past = (posts ?? []).filter(p => p.status !== 'pending')

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-white">Agenda de Posts</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Posts criados pelo sistema local e publicados automaticamente no horário.
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 flex gap-3">
        <div className="w-1 bg-blue-500 rounded-full shrink-0" />
        <p className="text-xs text-neutral-400">
          Os posts são criados pelo App 2 (local) via Supabase e publicados aqui pelo worker Railway.
          Para criar um novo post, use o app local.
        </p>
      </div>

      {/* Próximos */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-300">Próximos agendamentos</h2>
          <span className="text-xs text-neutral-600">{upcoming.length} pendentes</span>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          {upcoming.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-600">
              Nenhum post agendado. Use o app local para criar posts.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Plataforma</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Agendado para</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Caption</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {upcoming.map((p, i) => (
                  <tr key={p.id} className={i < upcoming.length - 1 ? 'border-b border-neutral-800/50' : ''}>
                    <td className="px-4 py-3 text-white text-xs font-medium">
                      {(p.clients as { business_name?: string } | null)?.business_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-400 text-xs">{platformLabel[p.platform] ?? p.platform}</td>
                    <td className="px-4 py-3 text-neutral-400 text-xs whitespace-nowrap">
                      {new Date(p.scheduled_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs capitalize">{p.media_type ?? 'imagem'}</td>
                    <td className="px-4 py-3 text-neutral-400 text-xs max-w-[200px] truncate">
                      {p.caption ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[p.status]}`}>
                        {statusLabel[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <CancelButton postId={p.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Histórico */}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500">Histórico</h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Plataforma</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Data</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {past.map((p, i) => (
                  <tr key={p.id} className={i < past.length - 1 ? 'border-b border-neutral-800/50' : ''}>
                    <td className="px-4 py-3 text-neutral-400 text-xs">
                      {(p.clients as { business_name?: string } | null)?.business_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">{platformLabel[p.platform] ?? p.platform}</td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">
                      {new Date(p.scheduled_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[p.status]}`}>
                        {statusLabel[p.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
