import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/(auth)/login/actions'
import AgencySidebar from './sidebar'

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: appUser } = await supabase
    .from('app_users')
    .select('user_type, name')
    .eq('supabase_uid', user.id)
    .single()

  if (!appUser?.user_type?.startsWith('agency')) redirect('/client/dashboard')

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      <AgencySidebar name={appUser.name} userType={appUser.user_type} logout={logout} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
