'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface CreateClientData {
  business_name: string
  name: string
  niche: string
  contact_email: string
  contact_phone: string
  plan: string
}

export async function createClientAction(data: CreateClientData) {
  const supabase = await createClient()

  const { error } = await supabase.from('clients').insert({
    business_name: data.business_name,
    name: data.name,
    niche: data.niche || null,
    contact_email: data.contact_email || null,
    contact_phone: data.contact_phone || null,
    plan: data.plan,
    status: 'onboarding',
    onboarding_step: 1,
  })

  if (error) return { error: error.message }

  revalidatePath('/agency/clients')
  return { error: null }
}

export async function updateClientStatusAction(id: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/agency/clients')
  return { error: null }
}
