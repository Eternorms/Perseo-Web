import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
      {/* Sidebar */}
      <aside className="w-56 border-r border-neutral-800 flex flex-col py-6 px-4 gap-1">
        <div className="px-2 mb-6">
          <span className="text-sm font-semibold tracking-wide text-white">Perseo</span>
          <p className="text-xs text-neutral-500 mt-0.5">{appUser.name}</p>
        </div>
        <NavLink href="/agency/dashboard">Dashboard</NavLink>
        <NavLink href="/agency/clients">Clientes</NavLink>
        <NavLink href="/agency/inbox">Inbox</NavLink>
        <NavLink href="/agency/team">Equipe</NavLink>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="px-3 py-2 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
    >
      {children}
    </a>
  )
}
