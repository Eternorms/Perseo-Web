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
    .select('user_type')
    .eq('supabase_uid', user.id)
    .single()

  revalidatePath('/', 'layout')

  if (appUser?.user_type?.startsWith('agency')) {
    redirect('/agency/dashboard')
  } else {
    redirect('/client/dashboard')
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
