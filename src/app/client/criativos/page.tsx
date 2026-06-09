import { getClientContext } from '@/lib/get-client-context'
import { createAdminClient } from '@/lib/supabase/admin'
import CreativesGallery from './creatives-gallery'

export default async function CriativosPage() {
  const { clientId } = await getClientContext()

  const admin = createAdminClient()
  const { data: approvals } = await admin
    .schema('perseo')
    .from('creative_approvals')
    .select('id, title, description, media_url, thumbnail_url, status, client_feedback, submitted_at, decided_at, scheduled_at')
    .eq('client_id', clientId)
    .order('submitted_at', { ascending: false })

  const pending = (approvals ?? []).filter(a => a.status === 'pending').length

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Criativos</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Aprove ou solicite ajustes nos vídeos produzidos pela agência.
          </p>
        </div>
        {pending > 0 && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400">
            {pending} aguardando aprovação
          </span>
        )}
      </div>

      <CreativesGallery approvals={approvals ?? []} />
    </div>
  )
}
