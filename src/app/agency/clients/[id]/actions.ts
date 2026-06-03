'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
  agent_prompt: string
  agent_active: boolean
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
    agent_prompt: data.agent_prompt || null,
    agent_active: data.agent_active,
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/agency/clients/${id}`)
  revalidatePath('/agency/clients')
  return { error: null }
}
