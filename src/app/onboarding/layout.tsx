import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: appUser } = await supabase
    .from('app_users')
    .select('user_type')
    .eq('supabase_uid', user.id)
    .single()

  if (appUser?.user_type?.startsWith('agency')) redirect('/agency/dashboard')

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-start pt-12 px-4">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <span className="text-sm font-semibold tracking-wide text-white">Perseo</span>
          <p className="text-xs text-neutral-500 mt-1">Configure sua conta para começar</p>
        </div>
        {children}
      </div>
    </div>
  )
}
