'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getClientId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, clientId: null }
  const { data: appUser } = await supabase
    .from('app_users')
    .select('client_id')
    .eq('supabase_uid', user.id)
    .single()
  return { supabase, clientId: appUser?.client_id ?? null }
}

export async function saveStep1Action(data: {
  business_name: string
  name: string
  niche: string
  contact_name: string
  contact_email: string
  contact_phone: string
}) {
  const { supabase, clientId } = await getClientId()
  if (!clientId) return { error: 'Sessão inválida.' }

  const { error } = await supabase.from('clients').update({
    business_name: data.business_name,
    name: data.name,
    niche: data.niche || null,
    contact_name: data.contact_name || null,
    contact_email: data.contact_email || null,
    contact_phone: data.contact_phone || null,
    onboarding_step: 2,
    updated_at: new Date().toISOString(),
  }).eq('id', clientId)

  if (error) return { error: error.message }
  revalidatePath('/onboarding')
  return { error: null }
}

export async function saveStep2Action(data: {
  whatsapp_type: string
  whatsapp_instance: string
  whatsapp_phone: string
}) {
  const { supabase, clientId } = await getClientId()
  if (!clientId) return { error: 'Sessão inválida.' }

  const { error } = await supabase.from('clients').update({
    whatsapp_type: data.whatsapp_type || null,
    whatsapp_instance: data.whatsapp_instance || null,
    whatsapp_phone: data.whatsapp_phone || null,
    onboarding_step: 3,
    updated_at: new Date().toISOString(),
  }).eq('id', clientId)

  if (error) return { error: error.message }
  revalidatePath('/onboarding')
  return { error: null }
}

export async function saveStep3Action(data: { meta_page_id: string; meta_form_id: string }) {
  const { supabase, clientId } = await getClientId()
  if (!clientId) return { error: 'Sessão inválida.' }

  const { error } = await supabase.from('clients').update({
    meta_page_id: data.meta_page_id || null,
    meta_form_id: data.meta_form_id || null,
    onboarding_step: 4,
    updated_at: new Date().toISOString(),
  }).eq('id', clientId)

  if (error) return { error: error.message }
  revalidatePath('/onboarding')
  return { error: null }
}

export async function saveStep4Action(data: { calendar_id: string }) {
  const { supabase, clientId } = await getClientId()
  if (!clientId) return { error: 'Sessão inválida.' }

  const { error } = await supabase.from('clients').update({
    calendar_id: data.calendar_id || null,
    onboarding_step: 5,
    updated_at: new Date().toISOString(),
  }).eq('id', clientId)

  if (error) return { error: error.message }
  revalidatePath('/onboarding')
  return { error: null }
}

export async function saveStep5Action(data: { agent_prompt: string; agent_active: boolean }) {
  const { supabase, clientId } = await getClientId()
  if (!clientId) return { error: 'Sessão inválida.' }

  const { error } = await supabase.from('clients').update({
    agent_prompt: data.agent_prompt || null,
    agent_active: data.agent_active,
    onboarding_step: 6,
    updated_at: new Date().toISOString(),
  }).eq('id', clientId)

  if (error) return { error: error.message }
  revalidatePath('/onboarding')
  return { error: null }
}

export async function completeOnboardingAction() {
  const { supabase, clientId } = await getClientId()
  if (!clientId) return { error: 'Sessão inválida.' }

  const { error } = await supabase.from('clients').update({
    onboarding_step: 7,
    status: 'active',
    updated_at: new Date().toISOString(),
  }).eq('id', clientId)

  if (error) return { error: error.message }
  return { error: null }
}
