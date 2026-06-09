'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface UpdateClientData {
  business_name: string
  name: string
  niche: string
  contact_email: string
  contact_phone: string
  whatsapp_instance: string
  whatsapp_phone: string
  meta_page_id: string
  meta_form_id: string
  ig_page_id: string
  meta_token: string
  agent_prompt: string
  agent_active: boolean
  perseo_client_id: number | null
}

export async function updateClientAction(id: string, data: UpdateClientData) {
  const supabase = await createClient()

  const { error } = await supabase.from('clients').update({
    business_name: data.business_name,
    name: data.name,
    niche: data.niche || null,
    contact_email: data.contact_email || null,
    contact_phone: data.contact_phone || null,
    whatsapp_instance: data.whatsapp_instance || null,
    whatsapp_phone: data.whatsapp_phone || null,
    meta_page_id: data.meta_page_id || null,
    meta_form_id: data.meta_form_id || null,
    ig_page_id: data.ig_page_id || null,
    meta_token: data.meta_token || null,
    agent_prompt: data.agent_prompt || null,
    agent_active: data.agent_active,
    perseo_client_id: data.perseo_client_id ?? null,
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/agency/clients/${id}`)
  revalidatePath('/agency/clients')
  return { error: null }
}

export async function inviteClientAccessAction(clientId: string, data: { name: string; email: string }) {
  const supabase = await createClient()
  const { data: me } = await supabase.from('app_users').select('user_type').single()
  if (me?.user_type !== 'agency_owner') return { error: 'Sem permissão.' }

  const admin = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://perseo-web-production.up.railway.app'

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/onboarding`,
    data: { name: data.name },
  })
  if (inviteError) return { error: inviteError.message }

  const { error: insertError } = await admin.from('app_users').insert({
    supabase_uid: invited.user.id,
    user_type: 'client_owner',
    name: data.name,
    email: data.email,
    client_id: clientId,
  })
  if (insertError) return { error: insertError.message }

  revalidatePath(`/agency/clients/${clientId}`)
  return { error: null }
}
