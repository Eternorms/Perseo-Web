import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import CriativosBoard from './criativos-board'

export default async function AgencyCriativosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: approvals } = await admin
    .schema('perseo')
    .from('creative_approvals')
    .select(`
      id, title, description, media_url, thumbnail_url,
      status, client_feedback, submitted_at, decided_at,
      scheduled_at, meta_post_id, client_id
    `)
    .order('submitted_at', { ascending: false })

  const clientIds = [...new Set((approvals ?? []).map(a => a.client_id).filter(Boolean))]
  let brandMap: Record<number, string> = {}
  if (clientIds.length > 0) {
    const { data: clients } = await admin
      .schema('perseo')
      .from('clients')
      .select('id, brand')
      .in('id', clientIds)
    brandMap = Object.fromEntries((clients ?? []).map(c => [c.id, c.brand]))
  }

  const rows = (approvals ?? []).map(a => ({
    ...a,
    client_brand: brandMap[a.client_id] ?? null,
  }))

  const pending  = rows.filter(a => a.status === 'pending').length
  const revision = rows.filter(a => a.status === 'revision').length

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Criativos</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Gerencie aprovações, revisões e agendamentos de todos os clientes.
          </p>
        </div>
        <div className="flex gap-2">
          {revision > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400">
              {revision} em revisão
            </span>
          )}
          {pending > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400">
              {pending} aguardando cliente
            </span>
          )}
        </div>
      </div>

      <CriativosBoard approvals={rows} />
    </div>
  )
}
