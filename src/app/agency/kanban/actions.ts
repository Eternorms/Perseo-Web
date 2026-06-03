'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { type TaskStatus } from '@/types'

async function getMe() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, me: null }
  const { data: me } = await supabase.from('app_users').select('id, user_type').eq('supabase_uid', user.id).single()
  return { supabase, me }
}

export async function createTaskAction(data: {
  title: string
  description: string
  priority: string
  client_id: string
  assigned_to: string
  due_date: string
}) {
  const { supabase, me } = await getMe()
  if (!me) return { error: 'Não autenticado.' }

  const { error } = await supabase.from('tasks').insert({
    title: data.title,
    description: data.description || null,
    priority: data.priority || 'medium',
    client_id: data.client_id || null,
    assigned_to: data.assigned_to || null,
    due_date: data.due_date || null,
    created_by: me.id,
    status: 'backlog',
  })

  if (error) return { error: error.message }
  revalidatePath('/agency/kanban')
  return { error: null }
}

export async function updateTaskStatusAction(id: string, status: TaskStatus) {
  const { supabase, me } = await getMe()
  if (!me) return { error: 'Não autenticado.' }

  const { error } = await supabase.from('tasks').update({
    status,
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/agency/kanban')
  return { error: null }
}

export async function deleteTaskAction(id: string) {
  const { supabase, me } = await getMe()
  if (!me) return { error: 'Não autenticado.' }

  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/agency/kanban')
  return { error: null }
}
