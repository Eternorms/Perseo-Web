import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/(auth)/login/actions'
import ClientSidebar from './sidebar'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: appUser } = await supabase
    .from('app_users')
    .select('user_type, name, client_id')
    .eq('supabase_uid', user.id)
    .single()

  if (!appUser?.user_type?.startsWith('client')) redirect('/agency/dashboard')

  const isOwner = appUser.user_type === 'client_owner'

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      <ClientSidebar name={appUser.name} isOwner={isOwner} logout={logout} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
