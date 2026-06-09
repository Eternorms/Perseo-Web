'use server'

import { revalidatePath } from 'next/cache'
import { getClientContext } from '@/lib/get-client-context'
import { createAdminClient } from '@/lib/supabase/admin'

export async function decideCreativeAction(
  approvalId: number,
  status: 'approved' | 'rejected' | 'revision',
  feedback?: string
) {
  const { perseoClientId } = await getClientContext()
  if (!perseoClientId) return { error: 'Conta não vinculada ao sistema de produção.' }

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
    .eq('client_id', perseoClientId)
    .select('title, scheduled_at')
    .single()

  if (error || !appr) return { error: 'Criativo não encontrado.' }

  const title = appr.title ?? 'Criativo'

  if (status === 'approved') {
    const schedInfo = appr.scheduled_at
      ? ` Agendado para ${new Date(appr.scheduled_at).toLocaleDateString('pt-BR')}.`
      : ''
    await admin.schema('perseo').from('notifications').insert({
      client_id: perseoClientId,
      type: 'creative_approved',
      title: `Criativo aprovado: ${title}`,
      body: `O cliente aprovou o criativo.${schedInfo}`,
    })
  } else if (status === 'revision') {
    await admin.schema('perseo').from('notifications').insert({
      client_id: perseoClientId,
      type: 'creative_revision',
      title: `Revisão solicitada: ${title}`,
      body: feedback ? `Feedback: ${feedback}` : 'O cliente solicitou ajustes.',
    })
  } else if (status === 'rejected') {
    await admin.schema('perseo').from('notifications').insert({
      client_id: perseoClientId,
      type: 'creative_rejected',
      title: `Criativo rejeitado: ${title}`,
      body: feedback ? `Motivo: ${feedback}` : 'O cliente rejeitou o criativo.',
    })
  }

  revalidatePath('/client/criativos')
  return { error: null }
}
