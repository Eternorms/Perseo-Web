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

  const { data: clientRow } = await supabase
    .from('clients')
    .select('perseo_client_id')
    .eq('id', appUser.client_id)
    .single()

  return {
    supabase,
    appUser,
    clientId: appUser.client_id as string,
    perseoClientId: (clientRow?.perseo_client_id ?? null) as number | null,
  }
}
