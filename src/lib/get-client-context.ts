import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function getClientContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: appUser } = await supabase
    .from('app_users')
    .select('id, user_type, client_id, name')
    .eq('supabase_uid', user.id)
    .single()

  if (!appUser?.client_id) redirect('/onboarding')

  return { supabase, appUser, clientId: appUser.client_id as string }
}
