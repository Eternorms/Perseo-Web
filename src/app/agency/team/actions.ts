'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function inviteTeamMemberAction(data: {
  name: string
  email: string
  user_type: 'agency_owner' | 'agency_staff'
}) {
  const supabase = await createClient()
  const { data: me } = await supabase.from('app_users').select('user_type').single()
  if (me?.user_type !== 'agency_owner') return { error: 'Sem permissão.' }

  const admin = createAdminClient()

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    data.email,
    { data: { name: data.name } }
  )
  if (inviteError) return { error: inviteError.message }

  const { error: insertError } = await admin.from('app_users').insert({
    supabase_uid: invited.user.id,
    user_type: data.user_type,
    name: data.name,
    email: data.email,
  })
  if (insertError) return { error: insertError.message }

  revalidatePath('/agency/team')
  return { error: null }
}

export async function updateMemberTypeAction(memberId: string, user_type: 'agency_owner' | 'agency_staff') {
  const supabase = await createClient()
  const { data: me } = await supabase.from('app_users').select('user_type, id').single()
  if (me?.user_type !== 'agency_owner') return { error: 'Sem permissão.' }
  if (me?.id === memberId) return { error: 'Não é possível alterar o próprio tipo.' }

  const { error } = await supabase.from('app_users').update({ user_type }).eq('id', memberId)
  if (error) return { error: error.message }

  revalidatePath('/agency/team')
  return { error: null }
}

export async function removeMemberAction(memberId: string) {
  const supabase = await createClient()
  const { data: me } = await supabase.from('app_users').select('user_type, id').single()
  if (me?.user_type !== 'agency_owner') return { error: 'Sem permissão.' }
  if (me?.id === memberId) return { error: 'Não é possível remover a si mesmo.' }

  const admin = createAdminClient()
  const { data: member } = await supabase.from('app_users').select('supabase_uid').eq('id', memberId).single()
  if (!member) return { error: 'Membro não encontrado.' }

  await admin.auth.admin.deleteUser(member.supabase_uid)
  revalidatePath('/agency/team')
  return { error: null }
}
