'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    const msg =
      error.message.toLowerCase().includes('invalid login') ||
      error.message.toLowerCase().includes('invalid credentials')
        ? 'Email ou senha incorretos.'
        : error.message.toLowerCase().includes('email not confirmed')
          ? 'Confirme seu email antes de entrar.'
          : 'Erro ao fazer login. Tente novamente.'
    redirect(`/login?error=${encodeURIComponent(msg)}`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Busca o tipo do usuário para redirecionar corretamente
  const { data: appUser } = await supabase
    .from('app_users')
    .select('user_type, client_id')
    .eq('supabase_uid', user.id)
    .single()

  revalidatePath('/', 'layout')

  if (appUser?.user_type?.startsWith('agency')) {
    redirect('/agency/dashboard')
  } else if (appUser?.client_id) {
    const { data: client } = await supabase
      .from('clients')
      .select('onboarding_step')
      .eq('id', appUser.client_id)
      .single()
    redirect(client && client.onboarding_step >= 7 ? '/client/dashboard' : '/onboarding')
  } else {
    redirect('/onboarding')
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
