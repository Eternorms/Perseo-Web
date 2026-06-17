'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { type DealStage } from '@/types'

async function getMe() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, me: null }
  const { data: me } = await supabase.from('app_users').select('id, user_type').eq('supabase_uid', user.id).single()
  return { supabase, me }
}

export async function createDealAction(data: {
  business_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  niche: string
  source: string
  estimated_value: string
  notes: string
}) {
  const { supabase, me } = await getMe()
  if (!me) return { error: 'Não autenticado.' }

  const { error } = await supabase.from('deals').insert({
    business_name: data.business_name,
    contact_name: data.contact_name || null,
    contact_email: data.contact_email || null,
    contact_phone: data.contact_phone || null,
    niche: data.niche || null,
    source: data.source || 'outbound',
    estimated_value: data.estimated_value ? Number(data.estimated_value) : null,
    notes: data.notes || null,
    owner_id: me.id,
    created_by: me.id,
    stage: 'identified',
  })

  if (error) return { error: error.message }
  revalidatePath('/agency/pipeline')
  return { error: null }
}

export async function updateDealStageAction(id: string, stage: DealStage) {
  const { supabase, me } = await getMe()
  if (!me) return { error: 'Não autenticado.' }

  // Ganho → cria o cliente (uma única vez) e liga via converted_client_id.
  // Service-role porque a RLS de `clients` só libera agency_owner; o deal já é
  // gated por RLS (só agency lê/edita), então a conversão aqui é segura.
  if (stage === 'won') {
    const { data: deal } = await supabase.from('deals').select('*').eq('id', id).single()
    if (deal && !deal.converted_client_id) {
      const admin = createAdminClient()
      const { data: client, error: clientError } = await admin.from('clients').insert({
        name: deal.contact_name || deal.business_name,
        business_name: deal.business_name,
        niche: deal.niche,
        status: 'onboarding',
        monthly_value: deal.estimated_value,
        contact_name: deal.contact_name,
        contact_phone: deal.contact_phone,
        contact_email: deal.contact_email,
      }).select('id').single()
      if (clientError) return { error: `Falha ao criar cliente: ${clientError.message}` }

      const { error: linkError } = await supabase.from('deals').update({
        stage,
        converted_client_id: client.id,
        last_contact_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', id)
      if (linkError) return { error: linkError.message }

      revalidatePath('/agency/pipeline')
      revalidatePath('/agency/clients')
      return { error: null }
    }
  }

  const { error } = await supabase.from('deals').update({
    stage,
    last_contact_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/agency/pipeline')
  return { error: null }
}

export async function deleteDealAction(id: string) {
  const { supabase, me } = await getMe()
  if (!me) return { error: 'Não autenticado.' }

  const { error } = await supabase.from('deals').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/agency/pipeline')
  return { error: null }
}
