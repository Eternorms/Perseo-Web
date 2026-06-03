'use client'

import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/agency/dashboard', label: 'Dashboard' },
  { href: '/agency/clients', label: 'Clientes' },
  { href: '/agency/kanban', label: 'Kanban' },
  { href: '/agency/research', label: 'Criativos' },
  { href: '/agency/inbox', label: 'Inbox' },
  { href: '/agency/team', label: 'Equipe' },
]

interface Props {
  name: string
  userType: string
  logout: () => Promise<void>
}

export default function AgencySidebar({ name, logout }: Props) {
  const pathname = usePathname()

  return (
    <aside className="w-56 border-r border-neutral-800 flex flex-col py-6 px-4 gap-1">
      <div className="px-2 mb-6">
        <span className="text-sm font-semibold tracking-wide text-white">Perseo</span>
        <p className="text-xs text-neutral-500 mt-0.5 truncate">{name}</p>
      </div>
      <nav className="flex-1 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/agency/dashboard' && pathname.startsWith(item.href))
          return (
            <a
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              {item.label}
            </a>
          )
        })}
      </nav>
      <form action={logout} className="px-2">
        <button
          type="submit"
          className="w-full text-left px-3 py-2 rounded-lg text-xs text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/40 transition-colors"
        >
          Sair
        </button>
      </form>
    </aside>
  )
}
