import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { type Client } from '@/types'
import OnboardingWizard from './onboarding-wizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: appUser } = await supabase
    .from('app_users')
    .select('client_id')
    .eq('supabase_uid', user.id)
    .single()

  if (!appUser?.client_id) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-400 text-sm">Conta não vinculada a nenhuma clínica.</p>
        <p className="text-neutral-600 text-xs mt-1">Entre em contato com a Perseo para configurar seu acesso.</p>
      </div>
    )
  }

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', appUser.client_id)
    .single()

  if (!client) redirect('/login')

  if (client.onboarding_step >= 7) redirect('/client/dashboard')

  return <OnboardingWizard client={client as Client} />
}
