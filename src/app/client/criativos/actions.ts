'use server'

import { revalidatePath } from 'next/cache'
import { getClientContext } from '@/lib/get-client-context'
import { createAdminClient } from '@/lib/supabase/admin'

export async function decideCreativeAction(
  approvalId: number,
  status: 'approved' | 'rejected' | 'revision',
  feedback?: string
) {
  const { clientId } = await getClientContext()

  const admin = createAdminClient()

  const { data: appr, error } = await admin
    .schema('perseo')
    .from('creative_approvals')
    .update({
      status,
      client_feedback: feedback ?? null,
      decided_at: new Date().toISOString(),
    })
    .eq('id', approvalId)
    .eq('client_id', clientId)
    .select('title, scheduled_at')
    .single()

  if (error || !appr) return { error: 'Criativo não encontrado.' }

  if (status === 'approved') {
    const schedInfo = appr.scheduled_at
      ? ` Agendado para ${new Date(appr.scheduled_at).toLocaleDateString('pt-BR')}.`
      : ''
    await admin
      .schema('perseo')
      .from('notifications')
      .insert({
        client_id: clientId,
        type: 'creative_approved',
        title: `Criativo aprovado: ${appr.title ?? ''}`,
        body: `O cliente aprovou o criativo.${schedInfo}`,
      })
  }

  revalidatePath('/client/criativos')
  return { error: null }
}
