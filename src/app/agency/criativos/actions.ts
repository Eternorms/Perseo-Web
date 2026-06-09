'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAgency() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: appUser } = await supabase
    .from('app_users')
    .select('user_type')
    .eq('supabase_uid', user.id)
    .single()
  if (!appUser || !['agency_owner', 'agency_member'].includes(appUser.user_type)) return null
  return appUser
}

export async function scheduleCreativeAction(approvalId: number, scheduledAt: string) {
  const user = await requireAgency()
  if (!user) return { error: 'Sem permissão.' }

  const admin = createAdminClient()
  const { error } = await admin
    .schema('perseo')
    .from('creative_approvals')
    .update({ scheduled_at: scheduledAt })
    .eq('id', approvalId)

  if (error) return { error: error.message }

  revalidatePath('/agency/criativos')
  return { error: null }
}

export async function resubmitCreativeAction(approvalId: number) {
  const user = await requireAgency()
  if (!user) return { error: 'Sem permissão.' }

  const admin = createAdminClient()
  const { error } = await admin
    .schema('perseo')
    .from('creative_approvals')
    .update({ status: 'pending', decided_at: null, client_feedback: null })
    .eq('id', approvalId)

  if (error) return { error: error.message }

  revalidatePath('/agency/criativos')
  return { error: null }
}

export async function dismissCreativeAction(approvalId: number) {
  const user = await requireAgency()
  if (!user) return { error: 'Sem permissão.' }

  const admin = createAdminClient()
  const { error } = await admin
    .schema('perseo')
    .from('creative_approvals')
    .update({ status: 'rejected' })
    .eq('id', approvalId)
    .eq('status', 'revision')

  if (error) return { error: error.message }

  revalidatePath('/agency/criativos')
  return { error: null }
}
